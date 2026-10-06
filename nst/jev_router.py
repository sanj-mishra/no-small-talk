"""JEV router: the decision-native side of the apples-to-apples pair.

JEV (TypeSafe's hosted "System One" model, jev-latest) is given the SAME alert text, the
SAME team descriptions, and the SAME instruction as Gemini. The difference is the paradigm:
it selects from the fixed set of options and returns a full probability distribution plus a
calibrated `confidence`, instead of generating a string. That confidence is what lets the
shared review gate escalate genuinely-ambiguous alerts on principle rather than on vibes.

Two modes:
  * real (default): calls the TypeSafe API. Needs TYPESAFE_API_KEY.
  * mock ("jev-mock"): replays a committed sample distribution (data/jev_sample.json) so the
    full three-way comparison runs for anyone without early access.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

from .core import ROUTING_INSTRUCTION, RouteResult

SAMPLE_PATH = "data/jev_sample.json"


class JevRouter:
    def __init__(self, teams: dict[str, str], mock: bool = False,
                 sample_path: str = SAMPLE_PATH):
        self.teams = teams
        self.mock = mock
        self.system = "jev-mock" if mock else "jev"

        if mock:
            p = Path(sample_path)
            if not p.is_absolute() and not p.exists():
                p = Path(__file__).resolve().parent.parent / sample_path
            if not p.exists():
                raise RuntimeError(
                    f"jev-mock needs a sample fixture at {sample_path}; run real JEV once to "
                    "generate it (see README).")
            self._sample = json.loads(p.read_text())
            return

        if not os.environ.get("TYPESAFE_API_KEY"):
            raise RuntimeError("TYPESAFE_API_KEY not set")
        from typesafe_sdk import Choice, TypeSafeClient
        self._Choice = Choice
        self._client = TypeSafeClient()  # reads TYPESAFE_API_KEY, defaults to jev-latest

    def route(self, alert: dict) -> RouteResult:
        if self.mock:
            return self._replay(alert)

        start = time.perf_counter()
        resp = self._client.system_one(
            state=alert["text"],
            questions={"team": self._Choice(instructions=ROUTING_INSTRUCTION,
                                            criteria=self.teams)},
        )
        latency = time.perf_counter() - start

        ans = resp.answers["team"]
        probs = ans.probabilities
        try:
            probs = {k: float(v) for k, v in dict(probs).items()}
        except Exception:
            probs = None
        usage = getattr(resp, "usage", None)
        return RouteResult(
            system=self.system, alert_id=alert["id"],
            choice=getattr(ans, "choice", None),
            confidence=_as_float(getattr(ans, "confidence", None)),
            probabilities=probs, latency_s=latency,
            input_tokens=getattr(usage, "input_tokens", None),
            output_tokens=getattr(usage, "output_tokens", None),
        )

    def _replay(self, alert: dict) -> RouteResult:
        s = self._sample.get(alert["id"])
        if s is None:
            return RouteResult(system=self.system, alert_id=alert["id"],
                               error="no sample for this alert id")
        return RouteResult(
            system=self.system, alert_id=alert["id"],
            choice=s.get("choice"), confidence=s.get("confidence"),
            probabilities=s.get("probabilities"), latency_s=s.get("latency_s"),
            input_tokens=s.get("input_tokens"), output_tokens=s.get("output_tokens"),
            notes="replayed from sample",
        )


def _as_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
