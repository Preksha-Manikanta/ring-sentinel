"""Deterministic action policy.

Maps a deterministic risk level to a *non-binding suggested* analyst action.
This is policy, NOT a decision, and NEVER auto-executes. The LLM plays no part
here — the suggestion is a pure function of the deterministic risk level, and the
final action is always chosen by a human via the /approve human gate.

Allowed suggestions mirror the human-action enum exactly:
    WATCH · HOLD_PAYOUT · ESCALATE_HUMAN
No punitive/auto-block action is representable.
"""
from __future__ import annotations

# The only suggestions this policy can ever emit.
SUGGESTED_ACTIONS = ("WATCH", "HOLD_PAYOUT", "ESCALATE_HUMAN")


def suggested_action(level: str) -> str:
    """Return a non-binding suggested action for a deterministic risk level."""
    if level == "critical":
        return "ESCALATE_HUMAN"
    if level == "high":
        return "HOLD_PAYOUT"
    return "WATCH"
