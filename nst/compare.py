"""Before/after comparison across the two conditions (forced vs abstain).

Loads the two raw result files, scores each with metrics.summarize, and emits a per-system
table of how the key queue metrics move when the explicit review option is added. This is
what backs the talk's headline claim.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .core import REVIEW_THRESHOLD
from .metrics import summarize

# (metric key, label, "higher is better"?) — arrow direction is informational only.
METRICS = [
    ("accuracy_pct", "accuracy %"),
    ("misroute_pct", "misroutes % (of routable)"),
    ("missed_escalation_pct", "missed escalations % (of review)"),
    ("unnecessary_review_pct", "unnecessary reviews % (of routable)"),
    ("review_load_pct", "review load %"),
    ("mean_latency_s", "mean latency (s)"),
    ("est_cost_per_1k_usd", "est. cost / 1k ($)"),
]


def _fmt(v) -> str:
    return "n/a" if v is None else f"{v}"


def build(forced: dict, abstain: dict, threshold: float) -> dict:
    sf = summarize(forced, threshold)["systems"]
    sa = summarize(abstain, threshold)["systems"]
    systems = [s for s in sf if s in sa]
    out = {"threshold": threshold, "systems": {}}
    for name in systems:
        out["systems"][name] = {
            k: {"forced": sf[name][k], "abstain": sa[name][k]} for k, _ in METRICS
        }
    return out


def render_md(cmp: dict) -> str:
    L = [f"# Before / after: forced choice vs. explicit review option",
         "",
         f"_Review threshold = {cmp['threshold']}. 'forced' offers only the teams; 'abstain' "
         "adds one explicit review option. Nothing else differs._", ""]
    for name, metrics in cmp["systems"].items():
        L += [f"## {name}", "",
              "| metric | forced | with review |",
              "|---|---|---|"]
        for key, label in METRICS:
            cell = metrics[key]
            L.append(f"| {label} | {_fmt(cell['forced'])} | {_fmt(cell['abstain'])} |")
        L.append("")
    return "\n".join(L)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Compare forced vs abstain conditions.")
    p.add_argument("--forced", default="results/raw_forced.json")
    p.add_argument("--abstain", default="results/raw_abstain.json")
    p.add_argument("--threshold", type=float, default=REVIEW_THRESHOLD)
    p.add_argument("--out-dir", default="results")
    args = p.parse_args(argv)

    forced = json.loads(Path(args.forced).read_text())
    abstain = json.loads(Path(args.abstain).read_text())
    cmp = build(forced, abstain, args.threshold)
    md = render_md(cmp)
    print(md)
    outdir = Path(args.out_dir)
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / "before_after.md").write_text(md)
    (outdir / "before_after.json").write_text(json.dumps(cmp, indent=2))
    print(f"\nwrote before_after.md / before_after.json -> {outdir}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
