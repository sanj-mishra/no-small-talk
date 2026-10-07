# Before / after: forced choice vs. explicit review option

_Review threshold = 0.6. 'forced' offers only the teams; 'abstain' adds one explicit review option. Nothing else differs._

## rules

| metric | forced | with review |
|---|---|---|
| accuracy % | 96.7 | 96.7 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 16.7 | 16.7 |
| unnecessary reviews % (of routable) | 0.0 | 0.0 |
| review load % | 16.7 | 16.7 |
| mean latency (s) | 0.0 | 0.0 |
| est. cost / 1k ($) | 0.0 | 0.0 |

## jev

| metric | forced | with review |
|---|---|---|
| accuracy % | 80.0 | 96.7 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 100.0 | 16.7 |
| unnecessary reviews % (of routable) | 0.0 | 0.0 |
| review load % | 0.0 | 16.7 |
| mean latency (s) | 0.118 | 0.105 |
| est. cost / 1k ($) | 0.0217 | 0.0236 |

## gemini

| metric | forced | with review |
|---|---|---|
| accuracy % | 93.3 | 100.0 |
| misroutes % (of routable) | 0.0 | 0.0 |
| missed escalations % (of review) | 33.3 | 0.0 |
| unnecessary reviews % (of routable) | 0.0 | 0.0 |
| review load % | 13.3 | 20.0 |
| mean latency (s) | 0.812 | 0.809 |
| est. cost / 1k ($) | 0.1999 | 0.2088 |
