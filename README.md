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

> _Finalized in the last build step. Rough shape:_

```bash
uv sync
cp .env.example .env            # add keys you have; none required for the rules baseline
uv run python -m nst.run --demo # narrated walkthrough of the headline cases
```

You do **not** need a JEV key to see the three-way comparison — a `jev-mock` mode replays a
committed sample distribution. See [data/SCHEMA.md](data/SCHEMA.md) to bring your own alerts
and destination teams.

## Status

Under active construction — see the commit history. Sections marked _TODO_ are finalized in a
later commit.

## License

MIT — see [LICENSE](LICENSE).
