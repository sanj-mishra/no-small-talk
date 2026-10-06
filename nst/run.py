"""Run selected routing systems over the alert set and cache raw results.

Each system runs independently; if one is unavailable (missing API key) or a single alert
errors, it is recorded and the run continues. Output goes to results/raw.json, which
metrics.py consumes. The review gate is NOT applied here — it is applied at read time by
RouteResult.final(), so the threshold can be swept later without re-running anything.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

from .core import REVIEW_THRESHOLD, RouteResult, load_alerts, load_teams, with_review

# Router registry. Each entry maps a system name to a factory(teams) -> router with
# .route(alert) -> RouteResult. API-backed systems are added in later commits; importing
# lazily keeps the harness runnable with whatever is installed/available.
def _build_router(name: str, teams: dict):
    if name == "rules":
        from .rules import RulesRouter
        return RulesRouter(teams)
    if name == "gemini":
        from .gemini_router import GeminiRouter
        return GeminiRouter(teams)
    if name in ("jev", "jev-mock"):
        from .jev_router import JevRouter
        return JevRouter(teams, mock=(name == "jev-mock"))
    raise ValueError(f"unknown system: {name!r}")


AVAILABLE = ["rules", "gemini", "jev", "jev-mock"]  # extended as routers land
DEFAULT_SYSTEMS = "rules"


def run(systems: list[str], alerts_path: str, teams_path: str | None, out_path: str,
        condition: str = "forced") -> dict:
    teams = load_teams(teams_path)
    if condition == "abstain":
        teams = with_review(teams)  # offer the explicit review/abstain option
    alerts = load_alerts(alerts_path)
    results: list[dict] = []

    for name in systems:
        try:
            router = _build_router(name, teams)
        except Exception as e:  # unavailable system (e.g., missing key) — skip, don't fail
            print(f"  [skip] {name}: {e}", file=sys.stderr)
            continue
        ok = 0
        for alert in alerts:
            try:
                res = router.route(alert)
            except Exception as e:
                res = RouteResult(system=name, alert_id=alert["id"], error=str(e))
            results.append(res.to_dict())
            ok += res.error is None
        print(f"  [{name}] {ok}/{len(alerts)} ok")

    payload = {
        "generated_at": _dt.datetime.now(_dt.timezone.utc).isoformat(),
        "threshold": REVIEW_THRESHOLD,
        "condition": condition,
        "systems": systems,
        "teams": list(teams),
        "results": results,
    }
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(json.dumps(payload, indent=2))
    print(f"wrote {len(results)} results -> {out_path}")
    return payload


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    p = argparse.ArgumentParser(description="Route alerts through the selected systems.")
    p.add_argument("--systems", default=DEFAULT_SYSTEMS,
                   help=f"comma-separated: {', '.join(AVAILABLE)} (default: {DEFAULT_SYSTEMS})")
    p.add_argument("--alerts", default="data/alerts.json", help="path to alerts JSON")
    p.add_argument("--teams", default=None, help="optional path to a teams JSON (bring your own)")
    p.add_argument("--condition", choices=["forced", "abstain"], default="forced",
                   help="forced = teams only; abstain = teams + an explicit review option")
    p.add_argument("--out", default=None, help="where to write raw results "
                   "(default: results/raw_<condition>.json)")
    args = p.parse_args(argv)

    systems = [s.strip() for s in args.systems.split(",") if s.strip()]
    out = args.out or f"results/raw_{args.condition}.json"
    run(systems, args.alerts, args.teams, out, args.condition)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
