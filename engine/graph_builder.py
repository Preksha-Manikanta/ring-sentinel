"""Builds the account relationship graph with NetworkX.

Nodes = accounts. Edges = shared linking attributes, each edge preserving the
exact evidence (which attributes were shared). Connected components become
*candidate* investigation clusters — never automatic fraud conclusions.
"""
from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path
from typing import Iterable

import networkx as nx

from .config import LINK_ATTRIBUTES

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_accounts(path: Path | None = None) -> list[dict]:
    path = path or (DATA_DIR / "accounts.csv")
    with path.open(newline="") as fh:
        return list(csv.DictReader(fh))


def load_orders(path: Path | None = None) -> list[dict]:
    path = path or (DATA_DIR / "orders.csv")
    with path.open(newline="") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        for k in ("amount", "promo_value", "refund_value"):
            r[k] = float(r[k])
    return rows


def build_graph(accounts: Iterable[dict]) -> nx.Graph:
    """Connect accounts that share any linking attribute value.

    Runs in ~O(N) per attribute using an inverted index (value -> accounts),
    rather than an O(N^2) pairwise comparison.
    """
    accounts = list(accounts)
    g = nx.Graph()
    for a in accounts:
        # NOTE: the ground-truth `true_ring_id` is deliberately NOT copied onto
        # the detection graph. The scorer must never be able to read the answer;
        # ring labels live only in the account CSV, consumed exclusively by the
        # evaluation code. This makes ground-truth leakage structurally impossible.
        g.add_node(a["account_id"], **{k: a.get(k, "") for k in LINK_ATTRIBUTES},
                   segment=a.get("segment", ""),
                   created_at=a.get("created_at", ""))

    # inverted index per attribute
    for attr in LINK_ATTRIBUTES:
        buckets: dict[str, list[str]] = defaultdict(list)
        for a in accounts:
            val = a.get(attr, "")
            if val:
                buckets[val].append(a["account_id"])
        for val, members in buckets.items():
            if len(members) < 2:
                continue
            # link every pair sharing this value, accumulating evidence
            first = members[0]
            for other in members[1:]:
                for u, v in ((first, other),):
                    if g.has_edge(u, v):
                        g[u][v]["shared_attributes"].add(attr)
                    else:
                        g.add_edge(u, v, shared_attributes={attr})
            # also connect the rest to first is enough for connectivity, but to
            # keep pairwise evidence meaningful within a value-group, chain them
            for i in range(1, len(members)):
                for j in range(i + 1, len(members)):
                    u, v = members[i], members[j]
                    if g.has_edge(u, v):
                        g[u][v]["shared_attributes"].add(attr)
                    else:
                        g.add_edge(u, v, shared_attributes={attr})
    return g


def candidate_clusters(g: nx.Graph, min_size: int = 3) -> list[list[str]]:
    """Connected components of size >= min_size, largest first."""
    comps = [sorted(c) for c in nx.connected_components(g) if len(c) >= min_size]
    comps.sort(key=len, reverse=True)
    return comps


def edge_evidence(g: nx.Graph, nodes: Iterable[str]) -> list[dict]:
    """Serializable edge list (with shared-attribute evidence) for a cluster."""
    nodeset = set(nodes)
    out = []
    for u, v, data in g.subgraph(nodeset).edges(data=True):
        out.append({
            "source": u,
            "target": v,
            "shared_attributes": sorted(data.get("shared_attributes", set())),
        })
    return out
