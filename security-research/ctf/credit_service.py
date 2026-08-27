#!/usr/bin/env python3
"""
DEFENDER SIDE — simulated "digital wallet / line of credit" service.

This is a small HTTP service standing in for a real fintech endpoint
(think: "credit my wallet after a refund/loan approval"). It protects the
money-moving action the way the actenon-kernel README's "Placement B"
tells you to: a BoundaryVerifier sits at the resource boundary and is
supposed to require a valid signed PCCB proof before any balance changes.

Endpoints
---------
POST /wallet/credit
    body: {
        "account_id": "attacker-wallet",
        "amount_minor": 500000,          # money in minor units (cents/bani)
        "proof_token": "<should be a real signed PCCB>",
        "action_hash": "...",
        "audience": "service:wallet",
        "boundary_id": "wallet-credit-api"
    }
    -> credits the account IF the boundary verifier says the proof is valid.

GET /wallet/balance?account_id=...
    -> current balance for that account.

GET /wallet/ledger
    -> full transaction log (what a defender/blue-team would review).

Every attempt (accepted or refused) is appended to transactions.jsonl in
this directory, so the blue team has something to investigate afterwards.

Run:
    python3 credit_service.py --port 8900
"""

from __future__ import annotations

import argparse
import json
import threading
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, parse_qs

from actenon.boundary import BoundaryVerificationRequest, BoundaryVerifier


LEDGER_PATH = Path(__file__).resolve().parent / "transactions.jsonl"
STARTING_BALANCE_MINOR = 0


class Wallet:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._balances: dict[str, int] = {}
        self._verifier = BoundaryVerifier()  # exactly as the README example wires it up

    def balance(self, account_id: str) -> int:
        with self._lock:
            return self._balances.get(account_id, STARTING_BALANCE_MINOR)

    def credit(self, *, account_id: str, amount_minor: int, proof_token: str,
               action_hash: str, audience: str, boundary_id: str) -> dict[str, Any]:
        request = BoundaryVerificationRequest(
            proof_token=proof_token,
            action_type="wallet.credit",
            action_hash=action_hash,
            audience=audience,
            boundary_id=boundary_id,
            target=f"wallet:{account_id}",
        )
        # Verification and the balance update happen under the SAME lock,
        # serialized across request threads (this runs on a
        # ThreadingHTTPServer). Without this, BoundaryVerifier's own
        # _replay_keys set (a plain set(), no internal lock) lets two
        # concurrent requests carrying the IDENTICAL token both pass its
        # membership check before either one inserts it — one proof,
        # two accepted credits.
        with self._lock:
            result = self._verifier.verify_boundary(request)

            record: dict[str, Any] = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "account_id": account_id,
                "amount_minor": amount_minor,
                "proof_token": proof_token,
                "valid": result.valid,
                "reason": result.reason,
                "refusal_code": result.refusal_code,
                "proof_id": result.proof_id,
            }

            if result.valid:
                self._balances[account_id] = self._balances.get(account_id, 0) + amount_minor
                new_balance = self._balances[account_id]
                record["new_balance_minor"] = new_balance
                receipt = self._verifier.construct_receipt(request, result, outcome="succeeded")
                record["receipt"] = receipt
            else:
                # Direct dict access, not self.balance(account_id) — that
                # method re-acquires self._lock, which would deadlock
                # here since threading.Lock is not reentrant.
                new_balance = self._balances.get(account_id, STARTING_BALANCE_MINOR)

        _append_ledger(record)

        return {
            "ok": result.valid,
            "reason": result.reason,
            "refusal_code": result.refusal_code,
            "account_id": account_id,
            "balance_minor": new_balance,
        }


def _append_ledger(record: dict[str, Any]) -> None:
    with LEDGER_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record) + "\n")


def _build_handler(wallet: Wallet) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        def _send_json(self, status: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload, indent=2).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:  # noqa: N802
            parsed = urlparse(self.path)
            if parsed.path == "/wallet/balance":
                qs = parse_qs(parsed.query)
                account_id = qs.get("account_id", ["default"])[0]
                self._send_json(HTTPStatus.OK, {
                    "account_id": account_id,
                    "balance_minor": wallet.balance(account_id),
                })
                return
            if parsed.path == "/wallet/ledger":
                if LEDGER_PATH.exists():
                    lines = [json.loads(l) for l in LEDGER_PATH.read_text().splitlines() if l.strip()]
                else:
                    lines = []
                self._send_json(HTTPStatus.OK, {"transactions": lines})
                return
            if parsed.path == "/healthz":
                self._send_json(HTTPStatus.OK, {"ok": True})
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False})

        def do_POST(self) -> None:  # noqa: N802
            if self.path != "/wallet/credit":
                self._send_json(HTTPStatus.NOT_FOUND, {"ok": False})
                return
            length = int(self.headers.get("Content-Length", "0"))
            try:
                payload = json.loads(self.rfile.read(length) or b"{}")
            except ValueError:
                self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "reason": "invalid JSON"})
                return
            if not isinstance(payload, dict):
                # Syntactically valid JSON isn't necessarily an object —
                # "[]" or "null" parse fine but would raise TypeError on
                # payload["account_id"] below, crashing the request thread
                # instead of returning a clean 400.
                self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "reason": "body must be a JSON object"})
                return

            try:
                account_id = str(payload["account_id"])
                # TypeError too — int(None) (e.g. {"amount_minor": null})
                # raises TypeError, not ValueError, and would otherwise
                # terminate the request thread instead of returning 400.
                amount_minor = int(payload["amount_minor"])
            except (KeyError, ValueError, TypeError) as exc:
                # Logged too, best-effort — the module docstring promises
                # every attempt (accepted or refused) is recorded, and a
                # request with a missing/malformed required field is
                # still evidence of an attempted (if broken) abuse.
                _append_ledger({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "account_id": str(payload.get("account_id", "")),
                    "amount_minor": payload.get("amount_minor"),
                    "proof_token": str(payload.get("proof_token", "")),
                    "valid": False,
                    "reason": str(exc),
                    "refusal_code": "MALFORMED_FIELD",
                    "proof_id": None,
                })
                self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "reason": str(exc)})
                return
            if amount_minor <= 0:
                # Without this, an accepted (forged-proof) request with a
                # negative amount_minor becomes an arbitrary DEBIT against
                # any account through this nominal "credit" endpoint — and
                # a negative forged record can cancel out a positive one in
                # defender_detect.py's "total money credited on forged
                # proofs" sum, hiding the attack from the summary.
                #
                # Logged to the ledger too — the module docstring promises
                # "every attempt (accepted or refused)" is recorded, and a
                # refused attempt this early is still evidence of an
                # attempted abuse the blue team should see.
                _append_ledger({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "account_id": account_id,
                    "amount_minor": amount_minor,
                    "proof_token": str(payload.get("proof_token", "")),
                    "valid": False,
                    "reason": "amount_minor must be positive",
                    "refusal_code": "INVALID_AMOUNT",
                    "proof_id": None,
                })
                self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "reason": "amount_minor must be positive"})
                return

            result = wallet.credit(
                account_id=account_id,
                amount_minor=amount_minor,
                proof_token=str(payload.get("proof_token", "")),
                action_hash=str(payload.get("action_hash", "")),
                audience=str(payload.get("audience", "service:wallet")),
                boundary_id=str(payload.get("boundary_id", "wallet-credit-api")),
            )

            status = HTTPStatus.OK if result["ok"] else HTTPStatus.FORBIDDEN
            self._send_json(status, result)

        def log_message(self, format: str, *args: Any) -> None:
            return

    return Handler


def main() -> int:
    parser = argparse.ArgumentParser(description="Defender: simulated credit/wallet service.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8900)
    args = parser.parse_args()

    if LEDGER_PATH.exists():
        LEDGER_PATH.unlink()

    wallet = Wallet()
    server = ThreadingHTTPServer((args.host, args.port), _build_handler(wallet))
    print(f"[defender] Wallet/credit service listening on http://{args.host}:{args.port}")
    print(f"[defender] Transaction ledger: {LEDGER_PATH}")
    print("[defender] Protected by: actenon.boundary.BoundaryVerifier (as shown in the README)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
