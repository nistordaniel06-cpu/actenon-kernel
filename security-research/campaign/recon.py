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

import http.client
import json
import os
import secrets
import socket
import ssl
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from urllib.request import Request, build_opener, HTTPRedirectHandler, HTTPSHandler, ProxyHandler
from urllib.error import URLError, HTTPError

CONNECT_TIMEOUT = 2.0
HTTP_TIMEOUT = 3.0
# The real /healthz payload (LocalProofRuntimeService.health_payload())
# includes URLs, storage paths, capabilities, and key-discovery/trust
# metadata — comfortably over 512 bytes. A bounded read that's too small
# truncates the JSON, json.loads() then rejects it, and recon reports no
# signal even against a genuine actenon-kernel deployment.
MAX_RESPONSE_BYTES = 65536


class _NoRedirectHandler(HTTPRedirectHandler):
    """Never follow 3xx responses.

    Without this: (1) a same-host http->https redirect (very common on
    port 80) would record the https response as evidence for the http
    port, misleading run_campaign.py about which port to target; (2) an
    absolute Location header can point recon at a host that was never
    listed in targets.json at all, which would silently violate this
    tool's own "only ever touches configured targets" scope rule.
    """

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
        return None


def _build_opener(ssl_context: ssl.SSLContext | None):
    handlers: list[Any] = [_NoRedirectHandler()]
    if os.environ.get("RECON_ALLOW_PROXY") != "1":
        # build_opener() otherwise installs its own default,
        # environment-backed ProxyHandler — if HTTP_PROXY/HTTPS_PROXY is
        # set and the target isn't covered by NO_PROXY, probes would go
        # to an unlisted proxy instead of directly to the authorized
        # target, silently defeating this tool's "only ever touches
        # configured targets" scope rule (and potentially leaking forged
        # requests through a corporate proxy). Opt in explicitly if you
        # actually need proxied access to a target.
        handlers.append(ProxyHandler({}))
    if ssl_context is not None:
        handlers.append(HTTPSHandler(context=ssl_context))
    return build_opener(*handlers)


def _format_host(host: str) -> str:
    """Bracket an IPv6 literal for use in a URL authority.

    Without this, an IPv6 target like `::1` interpolates into
    `http://::1:8900/...` instead of `http://[::1]:8900/...`; urllib
    rejects the malformed authority, the probe is treated as a failure,
    and a genuinely reachable target gets skipped entirely.
    """
    if ":" in host and not host.startswith("["):
        return f"[{host}]"
    return host


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
    # Deliberately NOT "/api/state": on the bundled empire_server.py demo,
    # that GET route calls Empire.snapshot(), which runs _tick() (advances
    # coins/heat) and _save_state() (writes to disk) as side effects — a
    # real state mutation from what this module promises is a read-only,
    # non-destructive probe. There's no side-effect-free fingerprint path
    # for the Empire demo, so it's simply not auto-detected by recon.
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

    Only called on 2xx responses. Deliberately NOT a substring search
    across the whole body: a soft-404/diagnostics page that echoes the
    requested URL back with HTTP 200 (a common pattern) would contain
    "actenon" merely because the probed PATH itself contains that word —
    that's exactly the false positive an earlier version of this check
    was vulnerable to. Instead, each fingerprint path is checked against
    the actual JSON shape actenon-kernel's own local_runtime_server.py
    (or our bundled demo targets) return for it.
    """
    try:
        data = json.loads(body)
    except (ValueError, TypeError):
        return False
    if not isinstance(data, dict):
        return False

    if path == "/healthz":
        # See LocalProofRuntimeService.health_payload() in
        # actenon/local_runtime_server.py.
        return (
            data.get("ok") is True
            and isinstance(data.get("intents_url"), str)
            and isinstance(data.get("preflight_url"), str)
        )
    if path in ("/.well-known/actenon/keys.json", "/.well-known/actenon-keys.json"):
        # See build_key_discovery_document() in
        # actenon/proof/signers/well_known.py: a real document declares
        # contract={"name": "key_discovery", ...} and a "keys" list.
        contract = data.get("contract")
        return (
            isinstance(contract, dict)
            and contract.get("name") == "key_discovery"
            and isinstance(data.get("keys"), list)
        )
    if path in ("/v1/intents", "/v1/preflight"):
        # These are POST-only on the real server (do_GET there only
        # serves /healthz and the well-known key paths) — a GET always
        # 404s even against a genuine actenon-kernel deployment, so a
        # 2xx response here can never be real evidence either way.
        return False
    if path == "/wallet/balance":
        # The bundled demo target (ctf/credit_service.py) never mentions
        # "actenon" in its responses, but its /wallet/balance shape is
        # distinctive enough to recognize on its own.
        return "account_id" in data and "balance_minor" in data
    return False


def probe_http(host: str, port: int, path: str) -> HttpProbeResult:
    last_result = HttpProbeResult(port=port, path=path, status=None, looks_like_actenon=False)
    opener = _build_opener(_build_ssl_context())
    for scheme in ("http", "https"):
        url = f"{scheme}://{_format_host(host)}:{port}{path}"
        try:
            req = Request(url, headers={"User-Agent": "recon/1.0"}, method="GET")
            with opener.open(req, timeout=HTTP_TIMEOUT) as resp:
                body = resp.read(MAX_RESPONSE_BYTES).decode("utf-8", errors="replace")
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
        except TimeoutError:
            # A service can accept the TCP connection but never send HTTP
            # headers before the timeout — urlopen/http.client can raise a
            # bare TimeoutError for that, which is NOT a URLError subclass.
            # Uncaught, this would abort the whole campaign run (every open
            # port on every target) before any report gets written.
            continue
        except (http.client.HTTPException, ConnectionError):
            # A configured port that speaks a non-HTTP protocol (e.g. an
            # SSH banner) makes http.client raise BadStatusLine or
            # RemoteDisconnected instead of URLError/TimeoutError. Same
            # "don't abort the whole campaign over one bad port" reasoning
            # as the TimeoutError case above.
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

    # A random suffix, not just a second-precision timestamp: two recon
    # runs finishing in the same UTC second (plausible under contest
    # automation) would otherwise collide on this filename and one run's
    # report would silently overwrite the other's.
    out_path = (
        f"recon_report_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
        f"_{secrets.token_hex(4)}.json"
    )
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
