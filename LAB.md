# No Small Talk — 30-minute demo lab

A presenter-driven demo with optional follow-along. Everything here runs **offline, no keys**,
so a full room can follow along without hitting any API.

The zero-setup option: open [`submission/demo-sandbox.html`](submission/demo-sandbox.html) in any
browser — it's self-contained (no install, no keys) and lets you route the 120 alerts, drag the
confidence gate, and watch misroutes vs. missed escalations move. Good for driving live, or as a
QR link the room opens on their phones.

## Setup (once, before the session)

```bash
uv sync
uv run python -m nst.flow   # should print the before/after story; if it does, you're ready
```

## Runsheet

| Time | Beat | Command / screen | The point |
|---|---|---|---|
| 0:00–0:04 | **Frame** | — | Three teams + a review lane, 120 synthetic alerts. Measure misroutes *and* missed escalations, not accuracy. |
| 0:04–0:12 | **The trap** | `nst.flow` (top table) / sandbox, "teams only" | Forced to pick a team, both models confidently route the no-context alerts. JEV 24/24 missed, Gemini 15/24. |
| 0:12–0:18 | **The fix** | same output, `with review` column | One extra option lifts JEV 79→93%, Gemini 88→98%. The option set, not the model. |
| 0:18–0:24 | **Your turn** | generate + route a custom mix (below), or the sandbox | Attendees make a queue like theirs and watch it route. |
| 0:24–0:27 | **Trade-off** | flow's per-system latency/cost rows | Opposite profiles: JEV ~12× faster, ~9× cheaper; they split only on the ambiguous no-context alerts. |
| 0:27–0:30 | **Wrap** | — | Clone it; bring your own alerts (`data/SCHEMA.md`). |

## The "your turn" commands (offline, no keys)

```bash
# make a mix like your own queue (change the counts / seed)
uv run python -m nst.generate --mix soc=6,cloud=6,prodsec=6,review=4 --seed 7 --out data/mine.json

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
