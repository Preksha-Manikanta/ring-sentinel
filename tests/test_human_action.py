"""Human-gate action flow: allowed actions record a hash-chained audit entry;
BLOCK and friends are rejected before anything is written."""
import pytest

from audit.audit_log import append_event, read_log, verify_chain
from llm.schemas import validate_human_action


@pytest.mark.parametrize("action", ["WATCH", "HOLD_PAYOUT", "ESCALATE_HUMAN"])
def test_allowed_action_accepted(action):
    assert validate_human_action(action).value == action


@pytest.mark.parametrize("action", ["BLOCK", "AUTO_BLOCK", "BAN", "SUSPEND", "DELETE"])
def test_punitive_action_rejected(action):
    with pytest.raises(ValueError):
        validate_human_action(action)


def test_successful_action_creates_audit_record(tmp_path):
    log = tmp_path / "audit.jsonl"
    action = validate_human_action("HOLD_PAYOUT").value
    rec = append_event(
        case_id="case_001",
        event_type="human_action",
        action=action,
        evidence={"score": 82.0},
        path=log,
    )
    entries = read_log(log)
    assert len(entries) == 1
    assert entries[0]["action"] == "HOLD_PAYOUT"
    assert entries[0]["current_hash"] == rec["current_hash"]

    ok, broken = verify_chain(log)
    assert ok and broken is None


def test_tampering_breaks_chain(tmp_path):
    log = tmp_path / "audit.jsonl"
    append_event("case_001", "human_action", "WATCH", path=log)
    append_event("case_001", "human_action", "ESCALATE_HUMAN", path=log)
    assert verify_chain(log)[0] is True

    # tamper with the first record's action
    lines = log.read_text().splitlines()
    lines[0] = lines[0].replace("WATCH", "ESCALATE_HUMAN")
    log.write_text("\n".join(lines) + "\n")

    ok, broken = verify_chain(log)
    assert ok is False and broken == 0
