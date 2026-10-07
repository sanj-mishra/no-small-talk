# No Small Talk: Does Your Security Queue Need an LLM?

A small, reproducible experiment for security practitioners. It routes the same set of
synthetic security alerts through three systems and compares them — not on accuracy alone,
but on the things that actually matter for a triage queue: **misroutes, human-review load,
latency, and cost.**

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
uv run python -m nst.generate --mix enterprise=6,email=6,cloud=6,review=4 --seed 7 --out data/mine.json
uv run python -m nst.run --systems rules --alerts data/mine.json --condition abstain --out results/mine.json
uv run python -m nst.metrics --raw results/mine.json
```

Live calls are optional: put `TYPESAFE_API_KEY` / `GEMINI_API_KEY` in `.env`, then run
`nst.run --systems rules,jev,gemini --condition forced|abstain` and `nst.compare`. See
[LAB.md](LAB.md) for the 30-minute demo-lab runsheet and [data/SCHEMA.md](data/SCHEMA.md) to
bring your own alerts and teams.

## Status

Under active construction — see the commit history. Sections marked _TODO_ are finalized in a
later commit.

## License

MIT — see [LICENSE](LICENSE).
