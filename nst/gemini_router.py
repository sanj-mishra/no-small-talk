"""Gemini router: the generative-LLM side of the apples-to-apples pair.

Gemini gets the SAME alert text, the SAME team descriptions, and the SAME instruction that
JEV gets. We constrain its output with a response schema so it must return one of the valid
team labels — which is the point: a *schema-valid* answer can still be the wrong team, and
the self-reported `confidence` it emits is not calibrated the way a decision-native model's
probability is. Both facts are what the talk is about.
"""

from __future__ import annotations

import json
import os
import time

from google import genai
from google.genai import types

from .core import ROUTING_INSTRUCTION, RouteResult

NAME = "gemini"
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


def _instruction(teams: dict[str, str]) -> str:
    lines = [ROUTING_INSTRUCTION, "", "The teams and what each one owns:"]
    for label, desc in teams.items():
        lines.append(f"- {label}: {desc}")
    lines += [
        "",
        "Choose exactly one team label. Also return `confidence`: your probability from 0.0 "
        "to 1.0 that this is the correct team. Use a LOW confidence when the alert lacks "
        "enough context to route reliably. Keep `reasoning` to one short sentence.",
    ]
    return "\n".join(lines)


class GeminiRouter:
    def __init__(self, teams: dict[str, str], model: str | None = None):
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) not set")
        # Hard per-request timeout so a saturated model fails fast instead of hanging for
        # minutes in the SDK's internal retries.
        self.client = genai.Client(api_key=api_key,
                                   http_options=types.HttpOptions(timeout=30000))
        self.teams = teams
        self.model = model or DEFAULT_MODEL
        labels = list(teams)
        self._config = types.GenerateContentConfig(
            system_instruction=_instruction(teams),
            temperature=0,
            response_mime_type="application/json",
            response_schema=types.Schema(
                type=types.Type.OBJECT,
                required=["team", "confidence", "reasoning"],
                properties={
                    "team": types.Schema(type=types.Type.STRING, enum=labels),
                    "confidence": types.Schema(type=types.Type.NUMBER),
                    "reasoning": types.Schema(type=types.Type.STRING),
                },
            ),
        )

    def _generate(self, text: str):
        """Call Gemini, retrying transient 429/503 (high demand / rate limit) with backoff.
        Latency is measured around the successful attempt only, not the waits."""
        last = None
        for attempt in range(5):
            try:
                start = time.perf_counter()
                resp = self.client.models.generate_content(
                    model=self.model, contents=text, config=self._config)
                return resp, time.perf_counter() - start
            except Exception as e:  # noqa: BLE001 — classify by message/status
                msg = str(e)
                transient = any(s in msg for s in ("503", "UNAVAILABLE", "429",
                                                   "RESOURCE_EXHAUSTED", "overloaded"))
                if not transient or attempt == 4:
                    raise
                last = e
                time.sleep(2 ** attempt)  # 1, 2, 4, 8s
        raise last  # unreachable

    def route(self, alert: dict) -> RouteResult:
        resp, latency = self._generate(alert["text"])
        data = json.loads(resp.text)
        try:
            confidence = max(0.0, min(1.0, float(data["confidence"])))
        except (TypeError, ValueError, KeyError):
            confidence = None
        um = getattr(resp, "usage_metadata", None)
        return RouteResult(
            system=NAME, alert_id=alert["id"],
            choice=data.get("team"), confidence=confidence, probabilities=None,
            latency_s=latency,
            input_tokens=getattr(um, "prompt_token_count", None),
            output_tokens=getattr(um, "candidates_token_count", None),
            notes=(data.get("reasoning") or None),
        )
