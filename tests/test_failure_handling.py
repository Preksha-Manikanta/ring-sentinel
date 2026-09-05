"""Claude is optional: its failure never takes down detection/score/evidence."""
import sys
import types

import pytest

from engine.graph_builder import build_graph, edge_evidence
from engine.risk_scorer import score_cluster
from llm import narrator
from audit.audit_log import append_event, verify_chain


def _ring(n=5):
    accts = [{
        "account_id": f"a{i}", "device_id": "d", "card_fingerprint": "c",
        "ip_address": "", "address": "", "upi_id": "u", "phone_number": "",
        "segment": "ring", "true_ring_id": "ring_x",
        "created_at": "2024-01-01T00:00:00",
    } for i in range(n)]
    oba = {a["account_id"]: [{
        "order_id": f"{a['account_id']}_o", "account_id": a["account_id"],
        "created_at": "2024-01-02T00:00:00", "amount": 1000.0,
        "promo_value": 600.0, "refund_value": 400.0, "status": "captured",
        "channel": "UPI", "location": "Pune"}] for a in accts}
    return accts, oba


def test_narrate_returns_none_without_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    assert narrator.narrate({"score": 80, "level": "critical"}) is None


def test_narrate_returns_none_when_client_fails(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    fake = types.ModuleType("anthropic")

    class _Boom:
        def __init__(self, *a, **k):
            raise RuntimeError("simulated Claude outage")

    fake.Anthropic = _Boom
    monkeypatch.setitem(sys.modules, "anthropic", fake)
    # any exception path must degrade to None, never fabricate narration
    assert narrator.narrate({"score": 80, "level": "critical",
                             "signals": [], "accounts": []}) is None


def test_deterministic_pipeline_survives_claude_failure():
    # engine produces graph + score + evidence with no LLM involvement at all
    accts, oba = _ring()
    g = build_graph(accts)
    nodes = [a["account_id"] for a in accts]
    cs = score_cluster(g, nodes, oba, "case_x")
    cs.edges = edge_evidence(g, nodes)
    assert cs.score > 0
    assert cs.level in ("medium", "high", "critical")
    assert cs.signals, "deterministic evidence must exist"
    assert cs.edges, "graph relationships must exist"


def test_engine_module_has_no_llm_import():
    import engine.risk_scorer as rs
    import engine.graph_builder as gb
    import engine.pipeline as pl
    for mod in (rs, gb, pl):
        src = open(mod.__file__).read().lower()
        assert "anthropic" not in src
        assert "import claude" not in src


def test_audit_hash_chain_detects_tampering(tmp_path):
    log = tmp_path / "audit.jsonl"
    append_event("case_1", "human_action", "WATCH", path=log)
    append_event("case_1", "human_action", "HOLD_PAYOUT", path=log)
    ok, broken = verify_chain(log)
    assert ok and broken is None
    # tamper with the first record
    lines = log.read_text().splitlines()
    lines[0] = lines[0].replace("WATCH", "ESCALATE_HUMAN")
    log.write_text("\n".join(lines) + "\n")
    ok, broken = verify_chain(log)
    assert not ok and broken == 0
