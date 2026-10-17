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
| 0:00–0:04 | **Frame** | — | Three teams + a human lane, 120 synthetic alerts. The question: does a routing queue actually need an LLM? |
| 0:04–0:10 | **Two models** | `nst.flow` / sandbox | JEV (decision-native, calibrated confidence, sub-second) vs Gemini (generative, self-reported confidence, seconds). Same alert, two very different machines. |
| 0:10–0:16 | **The bakeoff** | flow's before/after tables | Scored properly (with a human option) it's a near-tie — JEV 93%, Gemini 98%. Narrate the accuracy trap here: naive accuracy hides missed escalations (JEV 24/24, Gemini 15/24) until you add the option. Accuracy isn't the decider. |
| 0:16–0:24 | **Cost & latency decide** | flow's latency/cost rows | The real gap: JEV ~12× faster (~0.7s vs ~8.5s), ~9× cheaper (~$0.02 vs ~$0.22/1k). At 10k alerts/day on one stream: JEV ~2 hrs, Gemini ~24 hrs. |
| 0:24–0:28 | **Your turn** | generate + route a custom mix (below), or the sandbox | Attendees build a queue like theirs and route it. |
| 0:28–0:30 | **Wrap** | — | Clone it; bring your own alerts (`data/SCHEMA.md`). |

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
