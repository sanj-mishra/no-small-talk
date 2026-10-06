"""Shared contract for every router.

The key design choice for an apples-to-apples comparison: the destination teams and
their descriptions (`DEFAULT_TEAMS`), the routing instruction, and the alert text are
handed *verbatim* to every model-based router. The only thing that differs between JEV
and Gemini is the model paradigm — decision-native vs generative — not the prompt.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional

# --- The routing task -------------------------------------------------------------

# Destination teams, keyed by label, with the criteria description each router sees.
# Swap these out (or load your own via load_teams) to retarget the benchmark.
DEFAULT_TEAMS: dict[str, str] = {
    "enterprise": (
        "Enterprise Security — endpoint, host, and internal-network threats: EDR/antivirus "
        "detections, malware on workstations or servers, on-prem Active Directory and Windows "
        "authentication, lateral movement inside the corporate network, host-based IDS/DLP."
    ),
    "email": (
        "Email Security — email-borne threats: phishing, spear-phishing, business email "
        "compromise, spam, and malicious links or attachments delivered by email, including "
        "secure email gateway detections."
    ),
    "cloud": (
        "Cloud Security — cloud and SaaS platform threats: AWS/GCP/Azure activity, IAM and "
        "cloud console logins, storage buckets, cloud misconfiguration, and SaaS identity "
        "providers (Okta/Entra) including OAuth app consent grants."
    ),
}

ROUTING_INSTRUCTION = (
    "You are triaging a security alert in a SOC. Based only on the alert text, choose the "
    "single security team that should own this alert."
)

# The label used when a system is not confident enough to auto-route and escalates.
REVIEW_LABEL = "review"

# Confidence at or above this threshold auto-routes; below it, escalate to human review.
# The SAME gate is applied to every system, so the comparison is about the *quality* of
# each system's confidence, not about different escalation rules.
REVIEW_THRESHOLD = 0.6

# Illustrative pricing in USD per 1M tokens, used for the cost metric only.
# NOTE: verify the Gemini number against current Google pricing before publishing.
PRICING: dict[str, dict[str, float]] = {
    "jev": {"input": 0.042, "output": 0.0},     # TypeSafe launch: input $0.042/M, output free
    "gemini": {"input": 0.30, "output": 2.50},  # TODO: VERIFY current Gemini Flash pricing
    "rules": {"input": 0.0, "output": 0.0},
}


def valid_labels(teams: dict[str, str]) -> set[str]:
    """All acceptable ground-truth / final-decision labels: the teams plus 'review'."""
    return set(teams) | {REVIEW_LABEL}


# The "abstain" option. The experiment runs two conditions that differ ONLY by whether this
# option is offered: 'forced' (teams only) vs 'abstain' (teams + review). Everything else —
# alert text, instruction, the other option descriptions, the gate — is held constant.
REVIEW_OPTION_DESC = (
    "Insufficient context to route: the alert is truncated, ambiguous, or lacks the detail "
    "needed to assign an owner, and should be escalated to a human analyst."
)


def with_review(teams: dict[str, str]) -> dict[str, str]:
    """Return the option set with the explicit review/abstain option appended."""
    return {**teams, REVIEW_LABEL: REVIEW_OPTION_DESC}


# --- The result contract ----------------------------------------------------------


@dataclass
class RouteResult:
    """One system's decision on one alert.

    `choice`/`confidence` are what the system produced *before* the review gate.
    `final()` applies the gate to yield the routed destination (a team, or 'review').
    Keeping the gate out of the stored result lets metrics.py sweep the threshold later
    without re-running any models.
    """

    system: str
    alert_id: str
    choice: Optional[str] = None          # chosen team, pre-gate
    confidence: Optional[float] = None     # 0..1
    probabilities: Optional[dict[str, float]] = None
    latency_s: Optional[float] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    notes: Optional[str] = None            # e.g. a model's short reasoning, for demo/inspection
    error: Optional[str] = None

    def final(self, threshold: float = REVIEW_THRESHOLD) -> str:
        """Routed destination after the human-review gate."""
        if self.error or self.choice is None:
            return REVIEW_LABEL
        if self.confidence is None or self.confidence < threshold:
            return REVIEW_LABEL
        return self.choice

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "RouteResult":
        fields = {k: d.get(k) for k in cls.__dataclass_fields__}
        return cls(**fields)


# --- Loaders (bring-your-own data) ------------------------------------------------

_REPO_ROOT = Path(__file__).resolve().parent.parent


def load_teams(path: Optional[str | Path] = None) -> dict[str, str]:
    """Load destination teams. Defaults to the built-in set; pass a JSON file
    ({label: description}) to retarget the benchmark to your own queue."""
    if path is None:
        return dict(DEFAULT_TEAMS)
    return dict(json.loads(Path(path).read_text()))


def load_alerts(path: str | Path = "data/alerts.json") -> list[dict]:
    """Load alerts from a JSON file shaped as {"alerts": [...]} or a bare list."""
    p = Path(path)
    if not p.is_absolute() and not p.exists():
        p = _REPO_ROOT / path
    data = json.loads(p.read_text())
    return data["alerts"] if isinstance(data, dict) else data
