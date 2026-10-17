"""End-to-end offline demo: the whole forced -> abstain story on the built-in 120 alerts,
read from the committed snapshot. No keys, no API calls — safe for a full room.

    uv run python -m nst.flow

For a custom mix instead, generate one and route it through the rules baseline (the one
system that scores novel alerts offline):

    uv run python -m nst.generate --mix soc=6,cloud=6,prodsec=6,review=4 --seed 7 --out data/mine.json
    uv run python -m nst.run --systems rules --alerts data/mine.json --condition abstain --out results/mine.json
    uv run python -m nst.metrics --raw results/mine.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .compare import build as compare_build, render_md as compare_render
from .core import REVIEW_LABEL, REVIEW_THRESHOLD, RouteResult, load_alerts
from .metrics import hero_cases

SNAPSHOT = "results/snapshot"


def _hero_block(abstain: dict, threshold: float) -> str:
    rows = hero_cases(abstain, threshold)
    L = ["## The headline cases (with the review option)", ""]
    for c in rows:
        L.append(f"**{c['scenario']}** — `{c['id']}` (truth: {c['ground_truth']})")
        for sysname, d in c["systems"].items():
            conf = "n/a" if d["confidence"] is None else f"{d['confidence']:.2f}"
            L.append(f"- {sysname}: {d['choice']} (conf {conf}) -> {d['final']}")
        L.append("")
    return "\n".join(L)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Offline end-to-end demo from the committed snapshot.")
    p.add_argument("--snapshot", default=SNAPSHOT)
    p.add_argument("--threshold", type=float, default=REVIEW_THRESHOLD)
    args = p.parse_args(argv)

    snap = Path(args.snapshot)
    forced = json.loads((snap / "raw_forced.json").read_text())
    abstain = json.loads((snap / "raw_abstain.json").read_text())

    print("=" * 70)
    print("NO SMALL TALK — offline demo (built-in 120 alerts, no API calls)")
    print("=" * 70)
    print("\nThe question: give each system only the 3 teams (forced), or also an")
    print("explicit 'review' option (abstain)? Watch what the option does.\n")

    cmp = compare_build(forced, abstain, args.threshold)
    print(compare_render(cmp))
    print()
    print(_hero_block(abstain, args.threshold))
    print("Read it: the review option lifts every learned system, and the one alert the")
    print("models disagree on is the genuinely ambiguous one. Same accuracy, different")
    print("speed and cost. Measure missed escalations + review load, not just accuracy.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
