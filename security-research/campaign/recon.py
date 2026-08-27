#!/usr/bin/env python3
"""
Recon module — non-destructive fingerprinting of authorized contest targets.

Rules this module follows, on purpose, regardless of what "is allowed":
  - Only ordinary GET/HEAD requests and TCP connect probes (what any normal
    client does). No flooding, no repeated retries, no packet crafting.
  - Only targets listed in targets.json (never scans ranges, never guesses
    hosts). This keeps the tool from ever drifting into "anywhere."
  - Read-only: it never sends a POST or attempts to change state. That is
    the exploit modules' job, run separately and deliberately.

For each target, this checks a short list of well-known paths that would
indicate an actenon-kernel-based service is running (the same paths
actenon-kernel's own local_runtime_server.py and our credit_service.py /
empire_server.py demos expose), plus a couple of generic web fingerprints.

Run:
    python3 recon.py targets.json
"""

from __future__ import annotations

import json
import os
import socket
import ssl
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

CONNECT_TIMEOUT = 2.0
HTTP_TIMEOUT = 3.0


def _build_ssl_context() -> ssl.SSLContext | None:
    """Off by default. Set RECON_INSECURE_TLS=1 only for an authorized CTF
    vulnbox using a self-signed certificate or an IP-addressed hostname that
    doesn't match its certificate (a realistic case for a target configured
    by IP, like targets.example.json) — never for scanning untrusted or
    production hosts. Without this, a cert mismatch raises URLError, recon
    records no signal, and run_campaign.py skips an otherwise-reachable
    target entirely."""
    if os.environ.get("RECON_INSECURE_TLS") == "1":
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    return None

# Paths that suggest an actenon-kernel-based service. Add more here as you
# learn what the contest's vulnbox actually exposes.
FINGERPRINT_PATHS = [
    "/healthz",
    "/.well-known/actenon/keys.json",
    "/.well-known/actenon-keys.json",
    "/v1/intents",
    "/v1/preflight",
    "/wallet/balance",
    "/api/state",
]


@dataclass
class PortResult:
    port: int
    open: bool


@dataclass
class HttpProbeResult:
    port: int
    path: str
    status: int | None
    looks_like_actenon: bool
    snippet: str = ""


@dataclass
class TargetReport:
    name: str
    host: str
    ports: list[PortResult] = field(default_factory=list)
    http_probes: list[HttpProbeResult] = field(default_factory=list)

    def open_web_ports(self) -> list[int]:
        return [p.port for p in self.ports if p.open]

    def actenon_signals(self) -> list[HttpProbeResult]:
        return [p for p in self.http_probes if p.looks_like_actenon]

    def actenon_signal_ports(self) -> set[int]:
        """Ports that showed actenon-kernel evidence — exploit modules
        should only run against these, not every open port on the host
        (a target can expose Actenon on one port and something unrelated
        on another)."""
        return {p.port for p in self.actenon_signals()}


def check_port(host: str, port: int) -> PortResult:
    try:
        with socket.create_connection((host, port), timeout=CONNECT_TIMEOUT):
            return PortResult(port=port, open=True)
    except OSError:
        return PortResult(port=port, open=False)


def _looks_like_actenon_response(path: str, body: str) -> bool:
    """Structural fingerprint for a *successful* response body only.

    Only called on 2xx responses — an error page that echoes the requested
    URL back (a common 404/diagnostics pattern) would otherwise contain
    "actenon" merely because the probed PATH itself contains that word,
    producing a false signal on a completely unrelated service.
    """
    lowered = body.lower()
    if any(marker in lowered for marker in ("actenon", "pccb", "boundaryverifier", "key_discovery")):
        return True
    if path == "/wallet/balance":
        # The bundled demo target (ctf/credit_service.py) never mentions
        # "actenon" in its responses, but its /wallet/balance shape is
        # distinctive enough to recognize on its own.
        try:
            data = json.loads(body)
        except (ValueError, TypeError):
            return False
        return isinstance(data, dict) and "account_id" in data and "balance_minor" in data
    return False


def probe_http(host: str, port: int, path: str) -> HttpProbeResult:
    last_result = HttpProbeResult(port=port, path=path, status=None, looks_like_actenon=False)
    ssl_context = _build_ssl_context()
    for scheme in ("http", "https"):
        url = f"{scheme}://{host}:{port}{path}"
        try:
            req = Request(url, headers={"User-Agent": "recon/1.0"}, method="GET")
            with urlopen(req, timeout=HTTP_TIMEOUT, context=ssl_context) as resp:
                body = resp.read(512).decode("utf-8", errors="replace")
                looks_like_actenon = _looks_like_actenon_response(path, body)
                return HttpProbeResult(port=port, path=path, status=resp.status, looks_like_actenon=looks_like_actenon, snippet=body[:200])
        except HTTPError as exc:
            # Error responses are never treated as fingerprint evidence —
            # see _looks_like_actenon_response's docstring — but a
            # plaintext request to a TLS-only port often surfaces as an
            # HTTPError too, so keep trying https before settling on this.
            body = ""
            try:
                body = exc.read(512).decode("utf-8", errors="replace")
            except Exception:
                pass
            last_result = HttpProbeResult(port=port, path=path, status=exc.code, looks_like_actenon=False, snippet=body[:200])
            continue
        except URLError:
            continue
    return last_result


def recon_target(name: str, host: str, ports: list[int]) -> TargetReport:
    report = TargetReport(name=name, host=host)
    for port in ports:
        report.ports.append(check_port(host, port))
    for port in report.open_web_ports():
        for path in FINGERPRINT_PATHS:
            report.http_probes.append(probe_http(host, port, path))
    return report


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 recon.py targets.json")
        return 1

    with open(sys.argv[1], "r", encoding="utf-8") as fh:
        config = json.load(fh)

    reports: list[TargetReport] = []
    for target in config["targets"]:
        name, host, ports = target["name"], target["host"], target["ports"]
        print(f"\n=== Recon: {name} ({host}) ===")
        report = recon_target(name, host, ports)
        for p in report.ports:
            print(f"  port {p.port}: {'OPEN' if p.open else 'closed'}")
        for probe in report.actenon_signals():
            print(f"  [ACTENON SIGNAL] {probe.path} -> HTTP {probe.status}: {probe.snippet[:100]!r}")
        if not report.actenon_signals():
            print("  no actenon-kernel signal found on the checked paths — inspect manually before assuming any exploit module applies.")
        reports.append(report)

    out_path = f"recon_report_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(
            [
                {
                    "name": r.name,
                    "host": r.host,
                    "open_ports": r.open_web_ports(),
                    "actenon_signals": [p.__dict__ for p in r.actenon_signals()],
                }
                for r in reports
            ],
            fh,
            indent=2,
        )
    print(f"\nSaved: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
