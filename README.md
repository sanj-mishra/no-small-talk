# No Small Talk: Does Your Security Queue Need an LLM?

A small, reproducible experiment for security practitioners. It routes the same set of
synthetic security alerts through three systems and compares them — not on accuracy alone,
but on the things that actually matter for a triage queue: **misroutes, missed escalations,
human-review load, latency, and cost.**

The three systems:

| System | Class | What it does |
|---|---|---|
| **rules** | deterministic baseline | keyword → team; no ML. The reference floor. |
| **JEV** | hosted *decision-native* model ([TypeSafe](https://typesafe.ai)) | picks from a fixed set of teams and returns a **calibrated** probability per option |
| **Gemini** | hosted *generative* LLM (Google) | prompted to pick from the same fixed set; returns a schema-valid team + a self-reported confidence |

**The question the repo is built to answer:** when is a bounded decision enough, when does a
generative model earn its cost, and when should a rule — or a human — own the call?

> This is a teaching/demo tool and a synthetic benchmark. It is **not** production triage, and
> results are presented as observed findings, failures included.

## Quickstart

No keys needed for any of this — it runs on committed results and a local rules baseline.

```bash
uv sync

# 1. The whole story, offline: forced vs. review-option, all three systems.
uv run python -m nst.flow

# 2. Build your own mix (offline, deterministic) and route it through the baseline.
uv run python -m nst.generate --mix soc=6,cloud=6,prodsec=6,review=4 --seed 7 --out data/mine.json
uv run python -m nst.run --systems rules --alerts data/mine.json --condition abstain --out results/mine.json
uv run python -m nst.metrics --raw results/mine.json
```

Live calls are optional: put `TYPESAFE_API_KEY` / `GEMINI_API_KEY` in `.env`, then run
`nst.run --systems rules,jev,gemini --condition forced|abstain` and `nst.compare`. See
[LAB.md](LAB.md) for the 30-minute demo-lab runsheet and [data/SCHEMA.md](data/SCHEMA.md) to
bring your own alerts and teams.

## What it finds (120 synthetic alerts)

Measured, not claimed — reproduce it with `nst.flow`. Two conditions: **forced** (teams only)
vs **+ review** (an explicit "send to a human" option). Review gate at confidence 0.6.

| system | forced acc | + review acc | missed escalations (forced → + review) |
|---|---|---|---|
| rules  | 90% | 90% | 7/24 → 7/24 |
| JEV    | 79% | **93%** | 24/24 → 7/24 |
| Gemini | 88% | **98%** | 15/24 → 2/24 |

**The headline is cost and latency, not accuracy.** Scored properly — with an explicit
"send to a human" option — JEV and Gemini finish a near-tie (93% vs 98%), both routing the
real alerts well, so accuracy isn't what decides. What decides: **JEV is ~12× faster
(~0.7s vs ~8.5s per call) and ~9× cheaper (~$0.02 vs ~$0.22 per 1k).** Same job, essentially
the same accuracy, an order of magnitude less time and money.

Accuracy detail for the curious: nobody misroutes a *routable* alert (0% in both conditions);
the only failure mode is **missed escalations** — no-context alerts confidently sent to a team —
which the explicit review option fixes for both models. The lever is the option set, not a
bigger model. (Synthetic set; "perfect here" ≠ perfect everywhere.)

## Try it in a browser

[`submission/demo-sandbox.html`](submission/demo-sandbox.html) is a self-contained, offline
page — open it in any browser (no keys, no Python) to route the 120 alerts yourself, drag the
confidence gate, and watch misroutes vs. missed escalations trade off live.

## License

MIT — see [LICENSE](LICENSE).
