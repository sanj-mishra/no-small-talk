# Before / after: forced choice vs. explicit review option

_Review threshold = 0.6. 'forced' offers only the teams; 'abstain' adds one explicit review option. Nothing else differs._

## rules

| metric | forced | with review |
|---|---|---|
| accuracy % | 93.3 | 93.3 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 33.3 | 33.3 |
| unnecessary reviews % (of routable) | 0.0 | 0.0 |
| review load % | 13.3 | 13.3 |
| mean latency (s) | 0.0 | 0.0 |
| est. cost / 1k ($) | 0.0 | 0.0 |

## jev

| metric | forced | with review |
|---|---|---|
| accuracy % | 80.0 | 93.3 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 100.0 | 33.3 |
| unnecessary reviews % (of routable) | 0.0 | 0.0 |
| review load % | 0.0 | 13.3 |
| mean latency (s) | 0.204 | 0.204 |
| est. cost / 1k ($) | 0.0232 | 0.0251 |

## gemini

| metric | forced | with review |
|---|---|---|
| accuracy % | 86.7 | 100.0 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 66.7 | 0.0 |
| unnecessary reviews % (of routable) | 0.0 | 0.0 |
| review load % | 6.7 | 20.0 |
| mean latency (s) | 2.379 | 2.853 |
| est. cost / 1k ($) | 0.2121 | 0.2242 |
