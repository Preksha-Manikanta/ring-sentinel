"""Orchestrates data -> graph -> deterministic cluster scores.

Pure deterministic composition of graph_builder + risk_scorer. No LLM here.
Shared by the API and the evaluation harness so both score identically.
"""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path

import networkx as nx

from .config import CONFIG
from .graph_builder import (
    build_graph,
    candidate_clusters,
    edge_evidence,
    load_accounts,
    load_orders,
)
from .risk_scorer import ClusterScore, score_cluster


class Engine:
    def __init__(self, accounts: list[dict], orders: list[dict]):
        self.accounts = accounts
        self.orders = orders
        self.accounts_by_id = {a["account_id"]: a for a in accounts}
        self.orders_by_account: dict[str, list[dict]] = defaultdict(list)
        for o in orders:
            self.orders_by_account[o["account_id"]].append(o)
        self.graph: nx.Graph = build_graph(accounts)
        self._clusters: list[ClusterScore] | None = None

    @classmethod
    def from_data_dir(cls, data_dir: Path | None = None) -> "Engine":
        acc_path = (data_dir / "accounts.csv") if data_dir else None
        ord_path = (data_dir / "orders.csv") if data_dir else None
        return cls(load_accounts(acc_path), load_orders(ord_path))

    def clusters(self) -> list[ClusterScore]:
        if self._clusters is None:
            out: list[ClusterScore] = []
            comps = candidate_clusters(self.graph, CONFIG.min_cluster_size)
            for i, nodes in enumerate(comps, start=1):
                cs = score_cluster(
                    self.graph, nodes, self.orders_by_account, f"case_{i:03d}"
                )
                cs.edges = edge_evidence(self.graph, nodes)
                out.append(cs)
            out.sort(key=lambda c: c.score, reverse=True)
            self._clusters = out
        return self._clusters

    def cluster(self, cluster_id: str) -> ClusterScore | None:
        return next((c for c in self.clusters() if c.cluster_id == cluster_id), None)

    def cluster_for_account(self, account_id: str) -> ClusterScore | None:
        return next(
            (c for c in self.clusters() if account_id in c.accounts), None
        )
