"""Pydantic schemas for LLM narration output.

The action enum is enforced at the SCHEMA level, not just the prompt. Only WATCH,
HOLD_PAYOUT and ESCALATE_HUMAN are representable. Any attempt to produce BLOCK /
AUTO_BLOCK / SUSPEND / BAN / DELETE fails validation and is rejected by code.
"""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class HumanAction(str, Enum):
    """The actions a HUMAN analyst may record. This is not a model-generated
    recommendation — Claude never returns an action. It exists only to validate
    the action a human chooses at the /approve gate.
    """
    WATCH = "WATCH"
    HOLD_PAYOUT = "HOLD_PAYOUT"
    ESCALATE_HUMAN = "ESCALATE_HUMAN"


# Explicitly forbidden — used by validators and by the forceful auto-block check.
FORBIDDEN_ACTIONS = frozenset(
    {"BLOCK", "AUTO_BLOCK", "SUSPEND", "BAN", "DELETE", "FREEZE", "TERMINATE"}
)


class IdentityResolution(BaseModel):
    """Fuzzy identity interpretation of ambiguous signals (Claude's job A)."""
    likely_same_actor: bool
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str


class Dossier(BaseModel):
    """Analyst-readable case file (Claude's job B).

    Claude receives the *already-computed* deterministic score and evidence and
    only narrates them. It never sets the numeric score AND it never returns an
    action/decision — there is deliberately no `recommended_action` field here.
    The suggested action comes from deterministic policy (engine/policy.py) and
    the final action is chosen by a human.
    """
    summary: str
    identity: IdentityResolution
    key_findings: list[str]
    uncertainty: str
    # Claude must not restate/override the engine score; carried through read-only.
    engine_score: float
    engine_level: str


def validate_human_action(value: object) -> HumanAction:
    """Enforce the action enum at the schema boundary.

    Rejects BLOCK/AUTO_BLOCK/SUSPEND/BAN/DELETE/etc. and anything outside the
    three allowed human actions. Used by the /approve human gate.
    """
    if isinstance(value, str) and value.strip().upper() in FORBIDDEN_ACTIONS:
        raise ValueError(
            f"Forbidden action '{value}': Ring Sentinel never auto-blocks. "
            f"Allowed: {[a.value for a in HumanAction]}"
        )
    return HumanAction(value)  # raises ValueError for any other unknown
