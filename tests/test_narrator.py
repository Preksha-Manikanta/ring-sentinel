"""Claude narration contains NO action/decision; the action enum rejects BLOCK.

Claude only explains. The suggested action is deterministic policy and the final
action is enforced at the human-gate boundary by `validate_human_action`.
"""
import pytest
from pydantic import ValidationError

from engine.policy import suggested_action
from llm.schemas import (
    Dossier,
    FORBIDDEN_ACTIONS,
    HumanAction,
    validate_human_action,
)


def _dossier_payload():
    return {
        "summary": "s",
        "identity": {"likely_same_actor": True, "confidence": 0.8, "rationale": "r"},
        "key_findings": ["f"],
        "uncertainty": "u",
        "engine_score": 80.0,
        "engine_level": "critical",
    }


def test_dossier_has_no_action_field():
    """Claude's schema must not be able to carry a decision/action."""
    for forbidden_field in ("recommended_action", "action", "decision"):
        assert forbidden_field not in Dossier.model_fields


def test_dossier_validates_without_any_action():
    d = Dossier.model_validate(_dossier_payload())
    assert d.summary == "s"
    assert d.engine_score == 80.0


def test_only_three_actions_exist():
    assert {a.value for a in HumanAction} == {
        "WATCH", "HOLD_PAYOUT", "ESCALATE_HUMAN"
    }


@pytest.mark.parametrize("action", ["WATCH", "HOLD_PAYOUT", "ESCALATE_HUMAN"])
def test_allowed_actions_validate(action):
    assert validate_human_action(action).value == action


@pytest.mark.parametrize("action", sorted(FORBIDDEN_ACTIONS))
def test_forbidden_actions_rejected(action):
    with pytest.raises(ValueError):
        validate_human_action(action)


def test_block_specifically_rejected():
    with pytest.raises(ValueError):
        validate_human_action("BLOCK")


def test_suggested_action_is_deterministic_policy():
    # pure function of the risk level; identical input -> identical output
    assert suggested_action("critical") == "ESCALATE_HUMAN"
    assert suggested_action("high") == "HOLD_PAYOUT"
    assert suggested_action("medium") == "WATCH"
    assert suggested_action("normal") == "WATCH"
    assert suggested_action("critical") == suggested_action("critical")
