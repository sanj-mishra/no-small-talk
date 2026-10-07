"""Generate a custom alert mix to route through the flow.

Two modes, both writing a normal alerts.json that `nst.run --alerts` can consume:

  * mix (default, offline, no keys): you give a count per label and a seed; a template bank
    composes plausible, correctly-labeled synthetic alerts. Deterministic — the same seed
    gives the same set, so a whole room can generate without any API.

      uv run python -m nst.generate --mix enterprise=6,email=6,cloud=6,review=4 --seed 7 \
          --out data/my_alerts.json

  * guidance (optional, needs GEMINI_API_KEY): you describe the queue you want in plain
    language and a generative model writes alerts in the schema. Richer, but the labels are
    the generator's own intent — treat them as self-labeled, not ground truth.

      uv run python -m nst.generate --guidance "healthcare SOC, lots of PHI exfil and vague
          EDR alerts" --n 30 --out data/my_alerts.json

All generated alerts are synthetic. Don't paste real alert data in.
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

from .core import REVIEW_LABEL, load_teams, valid_labels

# --- offline template bank --------------------------------------------------------
# Each template is a format string with {slots}; slots are filled from POOLS. Every
# template sits under the label it is written to be — that is the generated ground truth.

TEMPLATES: dict[str, list[str]] = {
    "enterprise": [
        "{edr} flagged {mal} on host {host} (user {user}); {tech} detected.",
        "{edr}: unsigned binary executing from %APPDATA% on {host}, beaconing to a known C2 IP.",
        "Host IDS: lateral movement from {ip} to multiple internal hosts over SMB (port 445).",
        "On-prem Active Directory: {num} failed Kerberos pre-auth attempts for {user} from {host}.",
        "Sysmon on {host}: credential-dumping tool wrote to disk, parent process launched by a service account.",
        "Antivirus: ransomware-style sequential file encryption spreading across a share from {host}.",
    ],
    "email": [
        "User-reported phishing from '{sender}' with a credential-harvesting {attach} attachment.",
        "{gw} blocked an inbound message carrying a {mal} loader in a password-protected archive.",
        "Business email compromise: CEO-impersonation wire-transfer request, reply-to an external address.",
        "{gw} blocked a campaign of {num} messages from lookalike domain '{domain}' with a phishing link.",
        "User clicked a link in an email to a fake {brand} login and submitted corporate credentials.",
        "Spoofed internal sender 'it-helpdesk@' asking {num} users to verify mailbox quota via a link.",
    ],
    "cloud": [
        "{cloud}: anomalous IAM calls (CreateAccessKey then AttachUserPolicy Admin) for '{user}' from a new IP.",
        "Storage bucket '{bucket}' ACL changed to public-read; objects now world-readable.",
        "{idp}: impossible-travel sign-in for {user} with MFA satisfied via push on both legs.",
        "{cloud}: a service-account key was created and immediately used from an unrecognized ASN.",
        "{idp}: legacy-auth sign-in succeeded for an exec account from a foreign IP, bypassing conditional access.",
        "{cloud}: root/owner console login from an unfamiliar device with no MFA challenge recorded.",
    ],
    REVIEW_LABEL: [
        "{tool} alert: anomalous activity detected on asset {host}. Risk score {num}. {missing}.",
        "SIEM correlation '{corr}' triggered for {user}; sub-events referenced but {missing}.",
        "Threat-intel match on an IOC observed 'somewhere in the environment'; {missing}.",
        "User ticket: 'something weird happened and my {thing} looked off.' No artifacts attached.",
        "{tool}: 'sensitive data movement detected'. Destination and channel fields are null; {missing}.",
    ],
}

POOLS: dict[str, list[str]] = {
    "edr": ["CrowdStrike Falcon", "Microsoft Defender", "SentinelOne"],
    "mal": ["Emotet", "Qakbot", "an IcedID", "a Cobalt Strike"],
    "host": ["WKS-{d4}", "SRV-FS{d2}", "LAPTOP-FIN{d2}", "DEV-BUILD-{d2}"],
    "user": ["jdoe", "mchen", "asingh", "kpatel", "svc-backup"],
    "tech": ["LSASS memory access", "process injection", "a scheduled-task persistence"],
    "ip": ["10.12.4.{d2}", "172.16.{d2}.{d2}"],
    "num": ["14", "40", "120", "240", "320"],
    "gw": ["Proofpoint", "the secure email gateway", "Mimecast"],
    "sender": ["payroll@adp-secure[.]com", "no-reply@docu-sign[.]net", "hr@workday-portal[.]com"],
    "attach": ["HTML", ".doc macro", "password-protected .zip"],
    "domain": ["rnicrosoft[.]com", "paypa1[.]com", "0kta-login[.]com"],
    "brand": ["DocuSign", "Microsoft 365", "Okta"],
    "cloud": ["AWS (GuardDuty)", "GCP", "Azure"],
    "bucket": ["acme-customer-pii", "prod-backups", "analytics-exports"],
    "idp": ["Okta", "Entra ID", "Azure AD"],
    "tool": ["SIEM", "the DLP connector", "the anomaly model"],
    "corr": ["Suspicious Behavior - Multiple", "Impossible Chain", "Rare Process + Net"],
    "missing": ["no further detail from the connector", "details truncated at the forwarder",
                "the source system is not identified", "the integration is reporting a degraded state"],
    "thing": ["computer", "email", "account"],
}


def _fill(template: str, rng: random.Random) -> str:
    """Fill {slot} tokens from POOLS, resolving nested {d2}/{d4} digit tokens."""
    out = template
    for _ in range(6):  # a few passes to resolve slots whose values contain slots
        changed = False
        for slot, choices in POOLS.items():
            token = "{" + slot + "}"
            while token in out:
                out = out.replace(token, rng.choice(choices), 1)
                changed = True
        if "{d2}" in out:
            out = out.replace("{d2}", f"{rng.randint(0, 99):02d}", 1); changed = True
        if "{d4}" in out:
            out = out.replace("{d4}", f"{rng.randint(1000, 9999)}", 1); changed = True
        if not changed:
            break
    return out


def generate_mix(mix: dict[str, int], seed: int, teams: dict[str, str]) -> list[dict]:
    rng = random.Random(seed)
    valid = valid_labels(teams)
    alerts, i = [], 0
    for label, count in mix.items():
        if label not in valid:
            raise ValueError(f"unknown label {label!r}; valid: {sorted(valid)}")
        if label not in TEMPLATES:
            raise ValueError(f"no offline templates for {label!r}; use --guidance (LLM mode)")
        for _ in range(count):
            i += 1
            text = _fill(rng.choice(TEMPLATES[label]), rng)
            alerts.append({"id": f"g{i}", "text": text, "ground_truth": label})
    rng.shuffle(alerts)
    return alerts


def generate_guided(guidance: str, n: int, teams: dict[str, str]) -> list[dict]:
    """LLM mode: describe the queue, a generative model writes alerts in the schema."""
    import os

    from google import genai
    from google.genai import types

    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise RuntimeError("guidance mode needs GEMINI_API_KEY (or GOOGLE_API_KEY)")
    client = genai.Client(api_key=key, http_options=types.HttpOptions(timeout=30000))
    labels = list(teams) + [REVIEW_LABEL]
    team_desc = "\n".join(f"- {k}: {v}" for k, v in teams.items())
    instruction = (
        f"Generate {n} synthetic SOC alerts for a routing exercise, following this guidance:\n"
        f"{guidance}\n\nEach alert routes to one of these labels:\n{team_desc}\n"
        f"- {REVIEW_LABEL}: genuinely lacks the context to route; should go to a human.\n\n"
        "Make them realistic but fully synthetic (no real names, orgs, or data). For each, set "
        "ground_truth to the single correct label. Include a few that belong in review. Vary phrasing."
    )
    schema = types.Schema(
        type=types.Type.ARRAY,
        items=types.Schema(
            type=types.Type.OBJECT, required=["text", "ground_truth"],
            properties={
                "text": types.Schema(type=types.Type.STRING),
                "ground_truth": types.Schema(type=types.Type.STRING, enum=labels),
            }),
    )
    model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
    resp = client.models.generate_content(
        model=model, contents=instruction,
        config=types.GenerateContentConfig(temperature=0.9, response_mime_type="application/json",
                                           response_schema=schema))
    raw = json.loads(resp.text)
    valid = valid_labels(teams)
    alerts = []
    for i, a in enumerate(raw, 1):
        if a.get("ground_truth") in valid and a.get("text", "").strip():
            alerts.append({"id": f"g{i}", "text": a["text"].strip(),
                           "ground_truth": a["ground_truth"], "generated": "llm"})
    return alerts


def _parse_mix(s: str) -> dict[str, int]:
    out = {}
    for part in s.split(","):
        k, _, v = part.partition("=")
        out[k.strip()] = int(v)
    return out


def main(argv: list[str] | None = None) -> int:
    from dotenv import load_dotenv
    load_dotenv()
    p = argparse.ArgumentParser(description="Generate a custom alert mix to route.")
    p.add_argument("--mix", help="offline counts per label, e.g. enterprise=6,email=6,cloud=6,review=4")
    p.add_argument("--guidance", help="LLM mode: describe the queue you want (needs GEMINI_API_KEY)")
    p.add_argument("--n", type=int, default=30, help="total alerts for --guidance mode")
    p.add_argument("--seed", type=int, default=0, help="seed for reproducible offline generation")
    p.add_argument("--teams", default=None, help="optional teams JSON (bring your own)")
    p.add_argument("--out", default="data/my_alerts.json")
    args = p.parse_args(argv)

    teams = load_teams(args.teams)
    if args.guidance:
        alerts = generate_guided(args.guidance, args.n, teams)
        note = f"guidance (LLM, self-labeled): {args.guidance!r}"
    else:
        mix = _parse_mix(args.mix) if args.mix else {k: 8 for k in teams} | {REVIEW_LABEL: 6}
        alerts = generate_mix(mix, args.seed, teams)
        note = f"offline mix {mix} seed={args.seed}"

    payload = {"_comment": f"generated: {note}. synthetic only.", "alerts": alerts}
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(payload, indent=2))
    from collections import Counter
    print(f"wrote {len(alerts)} alerts -> {args.out}")
    print("by label:", dict(Counter(a["ground_truth"] for a in alerts)))
    print(f"route them: uv run python -m nst.run --alerts {args.out} --condition abstain")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
