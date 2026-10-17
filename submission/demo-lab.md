# CFP Submission — Demo Lab

> Paste-ready source for the BSides NYC AI Village submission. Numbers are from the live
> run on 120 synthetic alerts (review threshold 0.6). Replace the **bio** placeholders before
> submitting.

---

## Title

**No Small Talk: Does Your Security Queue Need an LLM?**

## Format

30-minute **demo lab** — presenter-driven, with optional follow-along. Everything runs
**locally and offline** (committed results + a local rules baseline), so attendees can run
the exact commands on their own laptops with **no API keys and no internet** if they choose.

## One-line summary

A decision model, a generative LLM, and a pile of rules walk into a SOC queue — we route the
same 120 alerts through all three and measure the thing accuracy hides: who gets silently
sent to the wrong team, and who knows when to ask a human.

## Abstract

Security teams make bounded decisions constantly: does this alert belong to the SOC, Cloud
Security, or ProdSec — or does it lack the context to route at all? A generative LLM can make
that call, but it may be more model than the task needs. A newer class of *decision-native*
("System One") models picks from a fixed set of options and returns a calibrated confidence
instead of free text.

In this demo lab I route the same 120 synthetic alerts through three systems — a rules
baseline, **JEV** (a hosted decision-native model), and **Gemini** (a hosted generative LLM) —
each of which must choose an owning team or escalate to human review. We watch every system
confidently misroute the alerts that have *no* right team, see why a valid, high-confidence
answer can still be the wrong one, and then fix it with a single design change. Then attendees
generate a mix that looks like *their own* queue and run it themselves.

The point isn't to crown a winner from 30 examples — it's a reusable way to judge the
trade-off: when a bounded decision is enough, when a generative model earns its cost and
latency, and when a rule or a human should own the call. Results are shown as observed
findings, failures included — not production-ready triage.

## What happens in the room (runsheet)

1. **Frame (~4 min).** Three teams — SOC, Cloud Security, ProdSec — plus a review lane. 30
   synthetic alerts, six of which genuinely lack the context to route. Why we measure
   *misroutes and review load*, not just accuracy.
2. **The trap (~8 min).** Forced to pick a team, every system looks great on accuracy — and
   silently sends the no-context alerts to a team anyway (JEV misses all 6, Gemini 4 of 6). A
   valid, schema-correct, high-confidence answer to the wrong question.
3. **The fix (~6 min).** Add one explicit "review" option and re-run. Accuracy jumps — JEV
   79% → 93%, Gemini 88% → 98% — and the clear alerts are untouched. The fix is the *option
   set*, not a bigger model.
4. **Your turn (~6 min).** Attendees generate an alert mix shaped like their own queue and
   route it live, offline, on their laptops — and find where the models break on their data.
5. **The trade-off (~3 min).** Same near-perfect accuracy, opposite profiles: the decision
   model runs ~14× faster and roughly an order of magnitude cheaper per alert; the generative
   model is a touch more willing to escalate. The two disagree only on the genuinely ambiguous
   alerts — exactly where you'd want a human in the loop.
6. **Wrap (~3 min).** Clone the repo; swap in your own teams and alerts.

## What attendees take away

- A concrete SOC-operations use case for a decision-native model — beyond chatbots and summaries.
- Why a valid, well-formatted, confident answer can still send an alert to the wrong team.
- A practical evaluation pattern they can reuse: measure misroutes and unnecessary human
  reviews, not just accuracy or model speed.
- A working, open-source repo that runs offline and takes their own alert data.

## Hands-on details

- **Optional** to follow along — the demo stands alone if attendees just watch.
- To run it: a laptop with Python 3.10+ and [`uv`](https://docs.astral.sh/uv/). Clone, `uv sync`,
  then `uv run python -m nst.flow` for the full comparison and
  `uv run python -m nst.generate --mix ...` to build a custom mix. **No API keys required** —
  it runs on committed results and a local rules baseline. Live JEV/Gemini calls are an
  optional extra for anyone who brings their own key.
- Repo: *(link on acceptance)* · MIT-licensed.

## AV / room needs

Projector/HDMI, a power outlet, and my laptop. Wi-Fi is **not** required — the demo runs
offline. No special hardware.

## Honesty statement

All alerts are synthetic. 30 examples prove nothing on their own; results are presented as
observed findings, including failures, and never as production-ready automated triage. The one
accuracy difference between the two models is a single ambiguous alert — the robust, large-
magnitude differences are latency and cost.

## Speaker bio

*(fill in — lead with the JEV authorship for credibility)*

> **[Your name]** is **[role] at [org]**, working on **[focus]**. They wrote the explainer on
> JEV, the decision-native "System One" model from TypeSafe, and build and evaluate ML systems
> for security operations. *(Add anything relevant: prior talks, handle, etc.)*

JEV explainer: https://sanjana-mishra.medium.com/judge-classifier-jev-76bcc91fd5c1

## If compressed to a 5-minute lightning slot

Keep beats 1, 2, and 3: one no-context alert, the silent miss, and the one-line fix. Drop the
hands-on and the per-model trade-off table.
