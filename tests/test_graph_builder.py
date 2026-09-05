"""Seeded rings must surface as connected components with real shared-attr evidence."""
from engine.graph_builder import build_graph, candidate_clusters, edge_evidence


def _acct(aid, **attrs):
    base = {
        "account_id": aid, "device_id": "", "ip_address": "", "address": "",
        "card_fingerprint": "", "upi_id": "", "phone_number": "",
        "segment": "", "true_ring_id": "", "created_at": "2024-01-01T00:00:00",
    }
    base.update(attrs)
    return base


def test_ring_becomes_connected_component():
    # a 4-account ring sharing device + card
    ring = [
        _acct(f"acct_{i}", device_id="dev_X", card_fingerprint="card_Y")
        for i in range(4)
    ]
    # two unrelated organic accounts
    others = [_acct("acct_z1", device_id="dev_1"), _acct("acct_z2", device_id="dev_2")]
    g = build_graph(ring + others)
    clusters = candidate_clusters(g, min_size=3)
    assert len(clusters) == 1
    assert set(clusters[0]) == {a["account_id"] for a in ring}


def test_edges_preserve_shared_attribute_evidence():
    ring = [
        _acct(f"acct_{i}", device_id="dev_X", ip_address="10.0.0.1")
        for i in range(3)
    ]
    g = build_graph(ring)
    ev = edge_evidence(g, [a["account_id"] for a in ring])
    assert ev, "expected edges within the cluster"
    for e in ev:
        assert "device_id" in e["shared_attributes"]
        assert "ip_address" in e["shared_attributes"]


def test_single_shared_attribute_two_accounts_not_a_ring():
    pair = [_acct("a1", device_id="dev_shared"), _acct("a2", device_id="dev_shared")]
    g = build_graph(pair)
    # size-2 component is below the min ring size
    assert candidate_clusters(g, min_size=3) == []
