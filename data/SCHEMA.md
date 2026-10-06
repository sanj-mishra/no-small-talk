# Data schema — bring your own

This benchmark is data-driven. To run it against your own queue, swap two files.

## `alerts.json`

Shape: either a bare list of alerts, or `{"alerts": [ ... ]}`.

Each alert:

| field | required | meaning |
|---|---|---|
| `id` | yes | unique short id, e.g. `e1`, `m8` |
| `text` | yes | the alert content an analyst would see. Synthetic only — no real data. |
| `ground_truth` | yes | the correct destination: a team label, or `review` |
| `scenario` | no | tags a walkthrough case: `easy`, `disagreement`, or `missing_context` |

`ground_truth` must be one of your team labels (below) **or** the literal `review`.

### What `review` means

`review` is the correct answer when an alert genuinely lacks the context to be routed —
truncated logs, null fields, "something feels off" tickets. A *good* system escalates these
to a human instead of guessing. It is not a dumping ground for "hard" alerts that do have a
right owner; those keep their team label and are simply harder to get right.

## `teams.json` (optional)

Shape: `{ "<label>": "<description the router sees>", ... }`. Defaults to the built-in
Enterprise / Email / Cloud set in `nst/core.py`. The description is handed verbatim to every
model-based router, so write it the way you'd brief a new analyst.

```json
{
  "enterprise": "Enterprise Security — endpoint, host, and internal-network threats: ...",
  "email": "Email Security — phishing, BEC, malicious attachments ...",
  "cloud": "Cloud Security — AWS/GCP/Azure, IAM, buckets, SaaS identity ..."
}
```

## Running against your data

```bash
uv run python -m nst.run --alerts path/to/alerts.json --teams path/to/teams.json
```

Keep the set balanced and include some genuine `review` cases — the whole point is to measure
misroutes *and* unnecessary escalations, not accuracy alone.
