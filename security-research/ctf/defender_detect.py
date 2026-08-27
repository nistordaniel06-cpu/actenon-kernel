#!/usr/bin/env python3
"""
DEFENDER SIDE — compensating detection layer.

This does NOT touch actenon/boundary/__init__.py (the vulnerable file is
left exactly as-is, per the CTF rules). Instead it's what a blue team
would bolt on *around* a vulnerable service while the real fix (making
BoundaryVerifier actually call PCCBVerifier) is pending: an external
monitor that reads the transaction ledger credit_service.py writes and
flags transactions whose "proof" doesn't even look like a real PCCB
envelope.

Heuristic used (documented, not a real fix):
  A genuine PCCB, once wired end to end, is a signed structured artifact.
  Two wire shapes are accepted: the versioned envelope the README's example
  shows ("v1.eyJ...") and the actual unprefixed base64url-JSON encoding
  actenon-kernel's own FastAPI adapter produces (see
  actenon/adapters/fastapi.py:encode_json_header) — a real deployment may
  use either. A forged token from the naive attack (see
  attacker_drain_credit.py) is just raw random hex/text and will not match
  either shape, and will not decode to JSON with a
  {"contract": {"name": "pccb", ...}} structure.

This lets a defender catch the *current* naive exploit script without
patching the library — but note in the report/README section 5 that this
is a mitigation, not a fix: an attacker who bothers to shape their forged
token as "v1.<base64url-of-anything>" defeats this heuristic instantly,
because verify_boundary() still never checks the signature. The only real
fix is the one described in REPORT.md section 5.

Run after generating some traffic:
    python3 defender_detect.py
"""

from __future__ import annotations

import base64
import binascii
import json
import re
from pathlib import Path

LEDGER_PATH = Path(__file__).resolve().parent / "transactions.jsonl"
_ENVELOPE_RE = re.compile(r"^v1\.([A-Za-z0-9_-]+)$")
_BARE_BASE64URL_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def looks_like_real_pccb_envelope(proof_token: str) -> tuple[bool, str]:
    match = _ENVELOPE_RE.match(proof_token)
    if match:
        encoded = match.group(1)
    elif _BARE_BASE64URL_RE.match(proof_token):
        # actenon-kernel's actual wire encoding (encode_json_header in
        # actenon/adapters/fastapi.py) is unprefixed base64url JSON, with
        # no "v1." prefix. Accept that shape too, or genuine traffic from
        # the real adapter would always be flagged as forged.
        encoded = proof_token
    else:
        return False, "does not match a recognized PCCB encoding (bare or 'v1.'-prefixed base64url)"
    padding = "=" * (-len(encoded) % 4)
    try:
        decoded = base64.urlsafe_b64decode(encoded + padding)
        payload = json.loads(decoded)
    except (binascii.Error, ValueError, UnicodeDecodeError):
        return False, "envelope payload is not valid base64url-encoded JSON"
    contract = payload.get("contract") if isinstance(payload, dict) else None
    if not isinstance(contract, dict) or contract.get("name") != "pccb":
        return False, "decoded payload does not declare a pccb v1 contract"
    return True, "looks like a structurally plausible PCCB envelope"


def main() -> int:
    if not LEDGER_PATH.exists():
        print(f"[defender] No ledger found at {LEDGER_PATH}. Run the attack first.")
        return 1

    transactions = [json.loads(line) for line in LEDGER_PATH.read_text().splitlines() if line.strip()]
    print(f"[defender] Loaded {len(transactions)} transaction(s) from {LEDGER_PATH}\n")

    accepted = [tx for tx in transactions if tx.get("valid")]

    suspicious = []
    for tx in accepted:
        token = tx.get("proof_token", "")
        plausible, why = looks_like_real_pccb_envelope(token)
        status = "OK " if plausible else "SUSPICIOUS"
        print(f"[{status}] account={tx['account_id']!r:25} amount_minor={tx['amount_minor']:>10} "
              f"token={token[:28]!r:30} -> {why}")
        if not plausible:
            suspicious.append(tx)

    print(f"\n[defender] {len(suspicious)} of {len(accepted)} ACCEPTED credit(s) "
          f"look like forged, unsigned proofs.")
    if suspicious:
        total_suspicious_minor = sum(tx["amount_minor"] for tx in suspicious)
        print(f"[defender] Total money credited on forged proofs: "
              f"{total_suspicious_minor} minor units ({total_suspicious_minor/100:.2f} major units)")
        print("[defender] RECOMMENDATION: BoundaryVerifier.verify_boundary() must actually decode")
        print("           the token and call PCCBVerifier.verify() — see REPORT.md section 5.")
        print("           This heuristic is a stopgap; a shaped-but-still-unsigned token defeats it.")
    return 0 if not suspicious else 2


if __name__ == "__main__":
    raise SystemExit(main())
