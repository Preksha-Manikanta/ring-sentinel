"""Deterministic scoring: reproducible, ordered by severity, family/office stays low."""
from engine.graph_builder import build_graph, edge_evidence
from engine.risk_scorer import score_cluster


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


def _score(accounts, orders_by_account, cid="c1"):
    g = build_graph(accounts)
    nodes = [a["account_id"] for a in accounts]
    cs = score_cluster(g, nodes, orders_by_account, cid)
    cs.edges = edge_evidence(g, nodes)
    return cs


def test_scoring_is_deterministic():
    accts = [_acct(f"a{i}", device_id="d", card_fingerprint="c") for i in range(6)]
    oba = {a["account_id"]: _orders(a["account_id"], 10, promo=600) for a in accts}
    s1 = _score(accts, dict(oba))
    s2 = _score(accts, dict(oba))
    assert s1.score == s2.score


def test_severe_ring_scores_higher_than_mild():
    severe = [_acct(f"s{i}", device_id="d", card_fingerprint="c", upi_id="u")
              for i in range(9)]
    severe_oba = {a["account_id"]: _orders(a["account_id"], 12, promo=800, refund=700)
                  for a in severe}
    mild = [_acct(f"m{i}", device_id="d2", card_fingerprint="c2") for i in range(3)]
    mild_oba = {a["account_id"]: _orders(a["account_id"], 3, promo=50) for a in mild}

    s_sev = _score(severe, severe_oba, "sev")
    s_mild = _score(mild, mild_oba, "mild")
    assert s_sev.score > s_mild.score
    assert s_sev.level in ("high", "critical")


def test_family_shared_address_stays_low():
    # legitimate family: shares address only, normal behavior
    fam = [_acct(f"f{i}", address="addr_home") for i in range(4)]
    oba = {a["account_id"]: _orders(a["account_id"], 2, promo=20) for a in fam}
    cs = _score(fam, oba, "fam")
    assert cs.level in ("normal", "low")
    assert any(s.key == "weak_shared_only" for s in cs.signals)


def test_every_point_is_attributed():
    accts = [_acct(f"a{i}", device_id="d", card_fingerprint="c") for i in range(5)]
    oba = {a["account_id"]: _orders(a["account_id"], 8, promo=500) for a in accts}
    cs = _score(accts, oba)
    assert round(sum(s.contribution for s in cs.signals), 1) >= cs.score - 0.1
