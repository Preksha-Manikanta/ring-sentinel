"""Regression tests for the signal-quality scoring methodology.

These lock in the fix for the holdout under-scoring: the discriminator is the
number of INDEPENDENT shared identifiers, not a hand-tuned threshold. They also
guard against the forbidden shortcuts (hardcoding the holdout, special-casing a
ring id, or lowering the cutoff to match a specific holdout score).
"""
from pathlib import Path

from engine.config import CONFIG
from engine.graph_builder import build_graph, edge_evidence
from engine.risk_scorer import score_cluster

REPO = Path(__file__).resolve().parent.parent


def _acct(aid, created="2024-01-01T00:00:00", **attrs):
    base = {
        "account_id": aid, "device_id": "", "ip_address": "", "address": "",
        "card_fingerprint": "", "upi_id": "", "phone_number": "",
        "segment": "", "true_ring_id": "", "created_at": created,
    }
    base.update(attrs)
    return base


def _orders(aid, n, promo=0.0, refund=0.0, amount=1000.0):
    return [
        {"order_id": f"{aid}_o{i}", "account_id": aid,
         "created_at": "2024-01-02T00:00:00", "amount": amount,
         "promo_value": promo, "refund_value": refund, "status": "captured",
         "channel": "UPI", "location": "Pune"}
        for i in range(n)
    ]


def _score(accounts, oba, cid="c"):
    g = build_graph(accounts)
    nodes = [a["account_id"] for a in accounts]
    cs = score_cluster(g, nodes, oba, cid)
    cs.edges = edge_evidence(g, nodes)
    return cs


def test_multiple_independent_attributes_beat_single_attribute():
    # Two clusters, identical size and behavior. One shares TWO independent
    # identifiers, the other shares ONE. The multi-attribute cluster must score
    # materially higher — the core discriminator.
    two = [_acct(f"t{i}", ip_address="1.1.1.1", phone_number="p") for i in range(5)]
    one = [_acct(f"o{i}", ip_address="1.1.1.1") for i in range(5)]
    oba_two = {a["account_id"]: _orders(a["account_id"], 4, promo=300) for a in two}
    oba_one = {a["account_id"]: _orders(a["account_id"], 4, promo=300) for a in one}

    s_two = _score(two, oba_two, "two")
    s_one = _score(one, oba_one, "one")
    assert s_two.score >= s_one.score + 15
    assert any(s.key == "attribute_linkage" for s in s_two.signals)
    assert any(s.key == "weak_shared_only" for s in s_one.signals)


def test_multi_attribute_linkage_fires_without_two_strong_identifiers():
    # A ring linked by one strong + two weak identifiers (no second strong id)
    # must still register the attribute-linkage signal. This is the exact case
    # that previously fell through the old "needs >=2 strong" branch.
    ring = [_acct(f"r{i}", device_id="d", ip_address="2.2.2.2", address="addr")
            for i in range(5)]
    oba = {a["account_id"]: _orders(a["account_id"], 6, promo=500, refund=300)
           for a in ring}
    cs = _score(ring, oba)
    link = [s for s in cs.signals if s.key == "attribute_linkage"]
    assert link, "multi-attribute linkage must fire with only one strong id"
    assert link[0].contribution > CONFIG.weak_single_attr_points


def test_cross_signal_bonus_requires_both_linkage_and_behavior():
    # linkage + abusive behavior -> cross_signal fires
    ring = [_acct(f"c{i}", device_id="d", card_fingerprint="c") for i in range(5)]
    oba = {a["account_id"]: _orders(a["account_id"], 6, promo=700, refund=500)
           for a in ring}
    cs = _score(ring, oba)
    assert any(s.key == "cross_signal" for s in cs.signals)

    # linkage but benign behavior -> no cross_signal
    calm = [_acct(f"q{i}", device_id="d2", card_fingerprint="c2") for i in range(5)]
    calm_oba = {a["account_id"]: _orders(a["account_id"], 2, promo=10) for a in calm}
    cs2 = _score(calm, calm_oba, "calm")
    assert not any(s.key == "cross_signal" for s in cs2.signals)


def test_single_shared_identifier_stays_weak():
    fam = [_acct(f"f{i}", address="home") for i in range(4)]
    oba = {a["account_id"]: _orders(a["account_id"], 2, promo=20) for a in fam}
    cs = _score(fam, oba, "fam")
    assert cs.level in ("normal", "low")
    assert not any(s.key == "attribute_linkage" for s in cs.signals)


def test_size_alone_cannot_flag_a_cluster():
    # A large cluster with a single weak shared id and benign behavior must not
    # reach the flag cutoff on size alone.
    big = [_acct(f"b{i}", address="office") for i in range(12)]
    oba = {a["account_id"]: _orders(a["account_id"], 1, promo=0) for a in big}
    cs = _score(big, oba, "big")
    assert cs.score < CONFIG.high_threshold


def test_config_is_frozen_and_cutoff_not_matched_to_holdout():
    # ScorerConfig is a frozen dataclass; the flag cutoff is the high band and
    # must not have been lowered to the known holdout score of 54.1.
    import dataclasses
    assert getattr(CONFIG, "__dataclass_params__").frozen is True
    assert CONFIG.high_threshold == 55.0
    assert CONFIG.high_threshold != 54.1


def test_no_holdout_hardcoding_in_engine_and_eval():
    # No engine/eval source may special-case the holdout ring id or its score.
    for sub in ("engine", "eval"):
        for path in (REPO / sub).glob("*.py"):
            src = path.read_text()
            assert "ring_03" not in src, f"{path} hardcodes holdout ring id"
            assert "54.1" not in src, f"{path} hardcodes holdout score"


def test_detection_graph_carries_no_ground_truth_label():
    # The scorer must have no structural path to the answer: the graph node must
    # not carry true_ring_id / is_fraud / any ground-truth attribute.
    accts = [_acct(f"g{i}", device_id="d") for i in range(3)]
    for a in accts:
        a["true_ring_id"] = "ring_x"  # present on the CSV/account dict...
    g = build_graph(accts)
    for _n, data in g.nodes(data=True):
        for forbidden in ("true_ring_id", "is_fraud", "ground_truth", "label"):
            assert forbidden not in data, f"leaked {forbidden} into detection graph"


def test_metrics_math_matches_definition():
    # Known predictions/labels -> exact precision/recall (no hardcoding).
    from eval.metrics import evaluate, ANALYST_REVIEW_HOURS, LOADED_ANALYST_HOURLY_INR
    scope = {"a", "b", "c", "d", "e", "x"}   # 5 true + 1 legit
    truth = {"a", "b", "c", "d", "e"}
    flagged = {"a", "b", "c", "d", "e", "x"}  # all true + 1 legit account
    r = evaluate(flagged, truth, scope, false_positive_clusters=1, inr_prevented=100.0)
    assert (r.tp, r.fp, r.fn) == (5, 1, 0)
    assert abs(r.precision - 5 / 6) < 1e-9      # 83.33%
    assert r.recall == 1.0                      # 100%
    assert r.false_positive_cost == 1 * ANALYST_REVIEW_HOURS * LOADED_ANALYST_HOURLY_INR


def test_zero_flags_gives_zero_not_crash():
    from eval.metrics import evaluate
    r = evaluate(set(), {"a"}, {"a"}, 0, 0.0)
    assert (r.tp, r.fp, r.fn) == (0, 0, 1)
    assert r.precision == 0.0 and r.recall == 0.0
