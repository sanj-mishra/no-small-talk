# No Small Talk — 30-minute demo lab

A presenter-driven demo with optional follow-along. Everything here runs **offline, no keys**,
so a full room can follow along without hitting any API.

## Setup (once, before the session)

```bash
uv sync
uv run python -m nst.flow   # should print the before/after story; if it does, you're ready
```

## Runsheet

| Time | Beat | Command / screen | The point |
|---|---|---|---|
| 0:00–0:04 | **Frame** | — | Three teams + a review lane, 30 synthetic alerts. Measure misroutes *and* review load, not accuracy. |
| 0:04–0:12 | **The trap** | `uv run python -m nst.flow` (top table) | Forced to pick a team, every system confidently misroutes the no-context alerts. JEV 6/6 missed, Gemini 2/6. |
| 0:12–0:18 | **The fix** | same output, `with review` column | One extra option lifts JEV 80→97%, Gemini 93→100%. The option set, not the model. |
| 0:18–0:24 | **Your turn** | generate + route a custom mix (below) | Attendees make a queue like theirs and watch the baseline route it. |
| 0:24–0:27 | **Trade-off** | flow's per-system latency/cost rows | Same accuracy, opposite profiles: JEV ~7× faster, ~10× cheaper; r1 is the one disagreement. |
| 0:27–0:30 | **Wrap** | — | Clone it; bring your own alerts (`data/SCHEMA.md`). |

## The "your turn" commands (offline, no keys)

```bash
# make a mix like your own queue (change the counts / seed)
uv run python -m nst.generate --mix enterprise=6,email=6,cloud=6,review=4 --seed 7 --out data/mine.json

# route it through the rules baseline and score it
uv run python -m nst.run --systems rules --alerts data/mine.json --condition abstain --out results/mine.json
uv run python -m nst.metrics --raw results/mine.json
```

Novel alerts only route offline through `rules` (JEV/Gemini need live keys). With keys in
`.env`, add `--systems rules,jev,gemini` to route a custom mix through all three.

## Live (optional, if you brought keys)

```bash
uv run python -m nst.run --systems rules,jev,gemini --condition forced
uv run python -m nst.run --systems rules,jev,gemini --condition abstain
uv run python -m nst.compare
```
