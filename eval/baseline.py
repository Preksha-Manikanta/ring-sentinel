"""Naive baseline: exact-match duplicate detector.

Flags any pair of accounts that share ANY single identifier value, and treats
each resulting connected group as a fraud ring. This is the strawman Ring
Sentinel must beat: it cannot tell a real ring from a shared-address family or a
shared-office IP, so it over-flags.
"""
from __future__ import annotations

from collections import defaultdict

import networkx as nx

from engine.config import LINK_ATTRIBUTES


def baseline_clusters(accounts: list[dict]) -> list[set[str]]:
    g = nx.Graph()
    for a in accounts:
        g.add_node(a["account_id"])
    for attr in LINK_ATTRIBUTES:
        buckets: dict[str, list[str]] = defaultdict(list)
        for a in accounts:
            val = a.get(attr, "")
            if val:
                buckets[val].append(a["account_id"])
        for members in buckets.values():
            for other in members[1:]:
                g.add_edge(members[0], other)
    # every component with >1 account is "fraud" under the naive rule
    return [set(c) for c in nx.connected_components(g) if len(c) > 1]
