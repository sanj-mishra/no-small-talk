# Before / after: forced choice vs. explicit review option

_Review threshold = 0.6. 'forced' offers only the teams; 'abstain' adds one explicit review option. Nothing else differs._

## rules

| metric | forced | with review |
|---|---|---|
| accuracy % | 90.0 | 90.0 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 29.2 | 29.2 |
| unnecessary reviews % (of routable) | 5.2 | 5.2 |
| review load % | 18.3 | 18.3 |
| mean latency (s) | 0.0 | 0.0 |
| est. cost / 1k ($) | 0.0 | 0.0 |

## jev

| metric | forced | with review |
|---|---|---|
| accuracy % | 79.2 | 93.3 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 100.0 | 29.2 |
| unnecessary reviews % (of routable) | 1.0 | 1.0 |
| review load % | 0.8 | 15.0 |
| mean latency (s) | 0.216 | 0.712 |
| est. cost / 1k ($) | 0.0228 | 0.0248 |

## gemini

| metric | forced | with review |
|---|---|---|
| accuracy % | 87.5 | 98.3 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 62.5 | 8.3 |
| unnecessary reviews % (of routable) | 0.0 | 0.0 |
| review load % | 7.5 | 18.3 |
| mean latency (s) | 9.795 | 8.526 |
| est. cost / 1k ($) | 0.2091 | 0.2198 |
