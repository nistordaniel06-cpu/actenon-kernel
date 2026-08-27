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
import socket
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

CONNECT_TIMEOUT = 2.0
HTTP_TIMEOUT = 3.0

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


def check_port(host: str, port: int) -> PortResult:
    try:
        with socket.create_connection((host, port), timeout=CONNECT_TIMEOUT):
            return PortResult(port=port, open=True)
    except OSError:
        return PortResult(port=port, open=False)


def probe_http(host: str, port: int, path: str) -> HttpProbeResult:
    for scheme in ("http", "https"):
        url = f"{scheme}://{host}:{port}{path}"
        try:
            req = Request(url, headers={"User-Agent": "recon/1.0"}, method="GET")
            with urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                body = resp.read(512).decode("utf-8", errors="replace")
                looks_like_actenon = any(
                    marker in body.lower()
                    for marker in ("actenon", "pccb", "boundaryverifier", "key_discovery")
                )
                return HttpProbeResult(path=path, status=resp.status, looks_like_actenon=looks_like_actenon, snippet=body[:200])
        except HTTPError as exc:
            # A 4xx/5xx still tells us the port speaks HTTP and the path exists/doesn't.
            body = ""
            try:
                body = exc.read(512).decode("utf-8", errors="replace")
            except Exception:
                pass
            looks_like_actenon = any(
                marker in body.lower()
                for marker in ("actenon", "pccb", "boundaryverifier", "key_discovery")
            )
            return HttpProbeResult(path=path, status=exc.code, looks_like_actenon=looks_like_actenon, snippet=body[:200])
        except URLError:
            continue
    return HttpProbeResult(path=path, status=None, looks_like_actenon=False)


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
