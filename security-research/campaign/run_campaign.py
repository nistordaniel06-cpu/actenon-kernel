#!/usr/bin/env python3
"""
Campaign orchestrator — recon, then run applicable exploit modules, then
write a documented, timestamped report. This is the "vast library" entry
point: as you add modules to exploits/REGISTRY, they automatically run
against every target in targets.json.

Scope discipline (kept regardless of what the contest rules allow):
  - Only ever touches hosts listed in targets.json.
  - Runs recon first so results are labeled with what was actually found,
    not assumed.
  - Every exploit attempt (success or not) is written to the report —
    nothing is hidden, nothing is inferred without evidence.

Run:
    python3 run_campaign.py targets.json
"""

from __future__ import annotations

import json
import secrets
import sys
from datetime import datetime, timezone

from recon import recon_target
from exploits import REGISTRY


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 run_campaign.py targets.json")
        return 1

    with open(sys.argv[1], "r", encoding="utf-8") as fh:
        config = json.load(fh)

    campaign_report: list[dict] = []

    for target in config["targets"]:
        name, host, ports = target["name"], target["host"], target["ports"]
        print(f"\n{'=' * 60}\nTARGET: {name} ({host})\n{'=' * 60}")

        recon = recon_target(name, host, ports)
        open_ports = recon.open_web_ports()
        print(f"Open ports: {open_ports or 'none'}")

        target_findings = []
        signal_ports = recon.actenon_signal_ports()
        if not signal_ports:
            print("  no actenon-kernel signal found by recon; skipping exploit modules for "
                  "this target (inspect manually first if you believe one still applies).")
        else:
            # Only the ports that actually showed actenon evidence — a
            # target can expose Actenon on one port and something
            # unrelated on another open port on the same host.
            for port in sorted(signal_ports):
                for module in REGISTRY:
                    # Honor each module's documented applicability
                    # predicate (see exploits/__init__.py) instead of
                    # invoking it unconditionally on every signaled port
                    # — without this, a target's unrelated actenon
                    # evidence could still draw a module's full set of
                    # POST probes even when its own predicate says not to
                    # bother.
                    applies_if = getattr(module, "APPLIES_IF", None)
                    if applies_if is not None and not applies_if(recon):
                        print(f"  skipping {module.NAME} on {host}:{port} — recon signal doesn't match its applicability predicate")
                        continue
                    print(f"  running {module.NAME} against {host}:{port} ...")
                    results = module.run(name, host, port)
                    for r in results:
                        tag = "CONFIRMED" if r.confirmed else "no finding"
                        print(f"    [{tag}] {r.message}")
                        target_findings.append(r.__dict__)

        campaign_report.append(
            {
                "target": name,
                "host": host,
                "open_ports": open_ports,
                "actenon_signals": [p.__dict__ for p in recon.actenon_signals()],
                "findings": target_findings,
                "confirmed_count": sum(1 for f in target_findings if f["confirmed"]),
            }
        )

    # A random suffix, not just a second-precision timestamp: two campaign
    # runs finishing in the same UTC second (plausible under parallel
    # contest automation) would otherwise collide on this filename and one
    # run's report would silently overwrite (or corrupt, under concurrent
    # writes) the other's.
    out_path = (
        f"campaign_report_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
        f"_{secrets.token_hex(4)}.json"
    )
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(campaign_report, fh, indent=2)

    md_path = out_path.replace(".json", ".md")
    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write("# Campaign report\n\n")
        for entry in campaign_report:
            fh.write(f"## {entry['target']} ({entry['host']})\n\n")
            fh.write(f"- Open ports: {entry['open_ports']}\n")
            fh.write(f"- Confirmed findings: {entry['confirmed_count']}\n\n")
            for f in entry["findings"]:
                mark = "CONFIRMED" if f["confirmed"] else "no finding"
                fh.write(f"  - `[{mark}]` **{f['module']}** on port {f['port']}: {f['message']}\n")
            fh.write("\n")

    print(f"\nSaved: {out_path}\nSaved: {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
