"""Turn raw routing results into the numbers that matter for a triage queue.

Not just accuracy: a routing system has two very different failure modes, and they cost
very different things.

  * misroute        -- auto-routed to the WRONG team. Expensive: the alert sits in the
                       wrong queue until someone notices.
  * missed escalation-- auto-routed when it should have gone to a human. Dangerous: a
                       judgment call got made with insufficient context.
  * unnecessary review-- escalated something it could have routed. Wastes analyst time.

We also report review load (how much human work the system creates), latency, and cost,
and we sweep the review-confidence threshold to show the misroute/review-load trade-off.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from statistics import mean

from .core import PRICING, REVIEW_LABEL, REVIEW_THRESHOLD, RouteResult, load_alerts


def _categorize(truth: str, final: str) -> str:
    if truth == REVIEW_LABEL:
        return "correct_escalation" if final == REVIEW_LABEL else "missed_escalation"
    if final == truth:
        return "correct_route"
    if final == REVIEW_LABEL:
        return "unnecessary_review"
    return "misroute"


def _pct(n: int, d: int) -> float:
    return 0.0 if d == 0 else round(100 * n / d, 1)


def _p95(xs: list[float]) -> float:
    if not xs:
        return 0.0
    s = sorted(xs)
    return round(s[min(len(s) - 1, int(round(0.95 * (len(s) - 1))))], 3)


def _cost_per_1k(system: str, results: list[RouteResult]) -> float | None:
    price = PRICING.get(system.replace("-mock", ""))
    if price is None:
        return None
    tin = [r.input_tokens for r in results if r.input_tokens is not None]
    tout = [r.output_tokens for r in results if r.output_tokens is not None]
    if not tin and price["input"] == 0 and price["output"] == 0:
        return 0.0
    if not tin:
        return None
    avg_in = mean(tin)
    avg_out = mean(tout) if tout else 0.0
    per_alert = (avg_in * price["input"] + avg_out * price["output"]) / 1_000_000
    return round(per_alert * 1000, 4)


def summarize(payload: dict, threshold: float) -> dict:
    truth = {a["id"]: a["ground_truth"] for a in load_alerts()}
    n_routable = sum(1 for t in truth.values() if t != REVIEW_LABEL)
    n_review = sum(1 for t in truth.values() if t == REVIEW_LABEL)

    by_system: dict[str, list[RouteResult]] = defaultdict(list)
    for d in payload["results"]:
        by_system[d["system"]].append(RouteResult.from_dict(d))

    systems = {}
    for name, results in by_system.items():
        cats = defaultdict(int)
        for r in results:
            cats[_categorize(truth[r.alert_id], r.final(threshold))] += 1
        n = len(results)
        lat = [r.latency_s for r in results if r.latency_s is not None]
        systems[name] = {
            "n": n,
            "accuracy_pct": _pct(cats["correct_route"] + cats["correct_escalation"], n),
            "misroute_pct": _pct(cats["misroute"], n_routable),
            "missed_escalation_pct": _pct(cats["missed_escalation"], n_review),
            "unnecessary_review_pct": _pct(cats["unnecessary_review"], n_routable),
            "review_load_pct": _pct(cats["correct_escalation"] + cats["unnecessary_review"], n),
            "mean_latency_s": round(mean(lat), 3) if lat else None,
            "p95_latency_s": _p95(lat),
            "est_cost_per_1k_usd": _cost_per_1k(name, results),
            "counts": dict(cats),
        }
    return {"threshold": threshold, "n_routable": n_routable, "n_review": n_review,
            "systems": systems}


def sweep(payload: dict, steps: int = 21) -> dict:
    """Misroute rate and review load as the review threshold varies 0..1."""
    truth = {a["id"]: a["ground_truth"] for a in load_alerts()}
    n_routable = sum(1 for t in truth.values() if t != REVIEW_LABEL)
    n_review = sum(1 for t in truth.values() if t == REVIEW_LABEL)
    by_system: dict[str, list[RouteResult]] = defaultdict(list)
    for d in payload["results"]:
        by_system[d["system"]].append(RouteResult.from_dict(d))

    out = {}
    for name, results in by_system.items():
        # only meaningful for systems that emit a graded confidence
        confs = [r.confidence for r in results if r.confidence is not None]
        if len(set(confs)) <= 1:
            continue
        curve = []
        for i in range(steps):
            t = round(i / (steps - 1), 2)
            cats = defaultdict(int)
            for r in results:
                cats[_categorize(truth[r.alert_id], r.final(t))] += 1
            curve.append({
                "threshold": t,
                "misroute_pct": _pct(cats["misroute"], n_routable),
                "missed_escalation_pct": _pct(cats["missed_escalation"], n_review),
                "review_load_pct": _pct(
                    cats["correct_escalation"] + cats["unnecessary_review"], len(results)),
            })
        out[name] = curve
    return out


def hero_cases(payload: dict, threshold: float) -> list[dict]:
    alerts = {a["id"]: a for a in load_alerts()}
    tagged = [a for a in alerts.values() if "scenario" in a]
    by_alert: dict[str, list[RouteResult]] = defaultdict(list)
    for d in payload["results"]:
        by_alert[d["alert_id"]].append(RouteResult.from_dict(d))
    rows = []
    for a in tagged:
        rows.append({
            "scenario": a["scenario"], "id": a["id"], "text": a["text"],
            "ground_truth": a["ground_truth"],
            "systems": {r.system: {"choice": r.choice,
                                   "confidence": r.confidence,
                                   "final": r.final(threshold)}
                        for r in by_alert[a["id"]]},
        })
    return rows


# --- rendering --------------------------------------------------------------------

_COLS = [
    ("accuracy_pct", "acc%"), ("misroute_pct", "misroute%"),
    ("missed_escalation_pct", "missed-esc%"), ("unnecessary_review_pct", "unnec-rev%"),
    ("review_load_pct", "review-load%"), ("mean_latency_s", "lat(s)"),
    ("est_cost_per_1k_usd", "$/1k"),
]


def render_md(summary: dict, cases: list[dict]) -> str:
    L = [f"## Routing metrics (review threshold = {summary['threshold']})", "",
         f"_{summary['n_routable']} routable alerts, {summary['n_review']} that should "
         f"escalate to review._", "",
         "| system | " + " | ".join(h for _, h in _COLS) + " |",
         "|" + "---|" * (len(_COLS) + 1)]
    for name, s in summary["systems"].items():
        cells = []
        for key, _ in _COLS:
            v = s[key]
            cells.append("n/a" if v is None else (f"{v}" if "latency" in key or "cost" in key else f"{v}"))
        L.append(f"| {name} | " + " | ".join(cells) + " |")
    L += ["", "### Headline cases", ""]
    for c in cases:
        L.append(f"**{c['scenario']}** — `{c['id']}` (truth: **{c['ground_truth']}**): "
                 f"_{c['text']}_")
        for sysname, d in c["systems"].items():
            conf = "n/a" if d["confidence"] is None else f"{d['confidence']:.2f}"
            L.append(f"- {sysname}: chose **{d['choice']}** (conf {conf}) → routed **{d['final']}**")
        L.append("")
    return "\n".join(L)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Score raw routing results.")
    p.add_argument("--raw", default="results/raw.json")
    p.add_argument("--threshold", type=float, default=REVIEW_THRESHOLD)
    p.add_argument("--out-dir", default="results")
    args = p.parse_args(argv)

    payload = json.loads(Path(args.raw).read_text())
    summary = summarize(payload, args.threshold)
    curves = sweep(payload)
    cases = hero_cases(payload, args.threshold)

    md = render_md(summary, cases)
    print(md)
    outdir = Path(args.out_dir)
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / "metrics.md").write_text(md)
    (outdir / "metrics.json").write_text(json.dumps(
        {"summary": summary, "sweep": curves, "cases": cases}, indent=2))
    (outdir / "cases.md").write_text(render_md({"threshold": summary["threshold"],
                                                "n_routable": summary["n_routable"],
                                                "n_review": summary["n_review"],
                                                "systems": {}}, cases))
    print(f"\nwrote metrics.md / metrics.json / cases.md -> {outdir}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
