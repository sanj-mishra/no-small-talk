"""Rules baseline: deterministic keyword matching. No ML.

This is the reference floor — transparent and free, but brittle on novel phrasing and
unable to recognize when it simply lacks the context to route. It produces a pseudo-
confidence (how dominant the winning team's keyword matches are) so the SAME review gate
that the models get can be applied to it too.
"""

from __future__ import annotations

import re
import time

from .core import RouteResult

NAME = "rules"

# Natural, SOC-plausible keywords per team. Intentionally not tuned to the test set —
# a fair baseline, not a strawman (and not sabotaged either).
KEYWORDS: dict[str, list[str]] = {
    "enterprise": [
        "edr", "crowdstrike", "falcon", "defender", "antivirus", "sysmon", "lsass",
        "mimikatz", "powershell", "endpoint", "workstation", "laptop", "server",
        "active directory", "kerberos", "ntlm", "lateral movement", "smb", "pass-the-hash",
        "ransomware", "beacon", "c2", "process injection", "scheduled task", "host firewall",
        "credential-dumping", "credential dumping", "wks-", "srv-", "host",
    ],
    "email": [
        "phish", "phishing", "email", "mailbox", "inbox", "attachment", "proofpoint",
        "spam", "sender", "message", "recipient", "business email compromise", "bec",
        "wire transfer", "docusign", "macro", "invoice", "gateway", "spoof",
        "lookalike domain", "reply-to", "distribution list",
    ],
    "cloud": [
        "aws", "gcp", "azure", "s3", "bucket", "iam", "cloudtrail", "guardduty", "okta",
        "entra", "azure ad", "oauth", "console", "lambda", "secret", "service account",
        "service-account", "conditional access", "sign-in", "root account", "microsoft 365",
        "m365", "access key", "region eu-", "impossible-travel", "impossible travel",
    ],
}


class RulesRouter:
    def __init__(self, teams: dict[str, str]):
        # Only score against teams that actually exist in the active team set.
        self.teams = teams
        self.keywords = {t: KEYWORDS.get(t, []) for t in teams}

    def route(self, alert: dict) -> RouteResult:
        start = time.perf_counter()
        text = alert["text"].lower()
        scores: dict[str, int] = {}
        for team, kws in self.keywords.items():
            hits = sum(1 for kw in kws if _matches(kw, text))
            scores[team] = hits

        total = sum(scores.values())
        latency = time.perf_counter() - start

        if total == 0:
            # No signal at all -> no confident choice -> gate sends it to review.
            return RouteResult(
                system=NAME, alert_id=alert["id"], choice=None, confidence=0.0,
                probabilities={t: 0.0 for t in scores}, latency_s=latency,
            )

        probs = {t: scores[t] / total for t in scores}
        best = max(scores, key=lambda t: scores[t])
        best_count = scores[best]
        # Ties across teams => ambiguous => low confidence => review.
        tie = sum(1 for t in scores if scores[t] == best_count) > 1
        confidence = 0.0 if tie else best_count / total
        return RouteResult(
            system=NAME, alert_id=alert["id"], choice=best, confidence=confidence,
            probabilities=probs, latency_s=latency,
        )


def _matches(keyword: str, text: str) -> bool:
    # Word-ish boundary match so 'host' doesn't fire inside 'ghost'; prefixes like 'wks-'
    # and 'phish' are matched as substrings on purpose.
    if keyword.endswith("-") or keyword in {"phish"}:
        return keyword in text
    return re.search(rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])", text) is not None
