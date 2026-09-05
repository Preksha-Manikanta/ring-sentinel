"""Deterministic, explainable risk scoring for candidate clusters.

Same input -> same score, always. Every point of the score is attributed to a
named signal with human-readable evidence. No randomness, no LLM.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime

import networkx as nx

from .config import CONFIG, level_for


@dataclass
class Signal:
    key: str
    label: str
    contribution: float
    severity: str
    evidence: str


@dataclass
class ClusterScore:
    cluster_id: str
    accounts: list[str]
    score: float
    level: str
    signals: list[Signal] = field(default_factory=list)
    shared_attributes: list[str] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)


def _parse(ts: str) -> datetime | None:
    try:
        return datetime.fromisoformat(ts)
    except (ValueError, TypeError):
        return None


def _distinct_shared_attributes(g: nx.Graph, nodes: list[str]) -> dict[str, int]:
    """Count how many edges each shared attribute appears on within the cluster."""
    counts: dict[str, int] = defaultdict(int)
    for _u, _v, data in g.subgraph(nodes).edges(data=True):
        for attr in data.get("shared_attributes", set()):
            counts[attr] += 1
    return dict(counts)


def score_cluster(
    g: nx.Graph,
    nodes: list[str],
    orders_by_account: dict[str, list[dict]],
    cluster_id: str,
) -> ClusterScore:
    c = CONFIG
    signals: list[Signal] = []
    n = len(nodes)

    # 1) network shape — cluster size (capped so size alone cannot dominate)
    if n > c.min_cluster_size:
        pts = min(c.size_cap, (n - c.min_cluster_size) * c.size_weight)
        signals.append(Signal(
            "cluster_size", "Coordinated account cluster", round(pts, 1),
            "high" if n >= 6 else "medium",
            f"{n} accounts linked into a single connected component."))

    # 2) attribute linkage — the core discriminator.
    # Coordinated rings are held together by MULTIPLE independent shared
    # identifiers; legitimate family/office clusters share exactly ONE. We
    # reward the number of *distinct* shared attributes (of any kind), with an
    # additional bonus when those identifiers are strong payment/device
    # fingerprints. A single shared identifier stays weak evidence.
    attr_counts = _distinct_shared_attributes(g, nodes)
    distinct_total = len(attr_counts)
    strong = sorted(a for a in attr_counts if a in c.strong_attr_set)
    multi_attr_fired = False
    if distinct_total >= 2:
        multi_attr_fired = True
        base = c.multi_attr_base + (distinct_total - 2) * c.multi_attr_step
        base += len(strong) * c.strong_attr_bonus
        pts = round(min(c.attr_link_cap, base), 1)
        sev = "critical" if (distinct_total >= 3 or len(strong) >= 3) else "high"
        detail = f"{distinct_total} independent shared identifiers ({', '.join(sorted(attr_counts))})"
        if strong:
            detail += f"; {len(strong)} strong: {', '.join(strong)}"
        signals.append(Signal(
            "attribute_linkage", "Multiple independent shared identifiers",
            pts, sev,
            f"Cluster linked by {detail}. Independent overlaps across several "
            f"identifier types are the signature of a coordinated ring, not "
            f"an incidental family/office overlap."))
    elif attr_counts:
        # exactly one shared identifier — the family/office / organic case
        weak = ", ".join(sorted(attr_counts))
        signals.append(Signal(
            "weak_shared_only", "Single weak shared identifier",
            round(c.weak_single_attr_points, 1), "low",
            f"Accounts share only {weak}; a single shared identifier is "
            f"consistent with a legitimate family/office rather than an "
            f"abuse ring."))

    # behavioral aggregates
    total_orders = 0
    total_amount = 0.0
    total_promo = 0.0
    total_refund = 0.0
    for acct in nodes:
        for o in orders_by_account.get(acct, []):
            total_orders += 1
            total_amount += o["amount"]
            total_promo += o["promo_value"]
            total_refund += o["refund_value"]
            if o.get("status") == "chargeback":
                total_refund += 0  # already in refund_value

    behavior_fired = False

    # 3) velocity
    if n and total_orders:
        per_acct = total_orders / n
        ratio = min(1.0, per_acct / c.velocity_ref)
        if ratio > 0.4:
            behavior_fired = True
            pts = round(ratio * c.velocity_weight, 1)
            signals.append(Signal(
                "velocity", "Elevated transaction velocity", pts,
                "high" if ratio > 0.75 else "medium",
                f"{per_acct:.1f} orders/account (ref {c.velocity_ref:.0f})."))

    # 4) promo abuse
    if total_amount > 0:
        promo_ratio = total_promo / total_amount
        if promo_ratio > 0.2:
            behavior_fired = True
            pts = round(min(1.0, promo_ratio) * c.promo_ratio_weight, 1)
            signals.append(Signal(
                "promo_abuse", "High promo redemption ratio", pts,
                "high" if promo_ratio > 0.4 else "medium",
                f"Promo value is {promo_ratio*100:.0f}% of gross order value."))

        # 5) refund/chargeback concentration
        refund_ratio = total_refund / total_amount
        if refund_ratio > 0.2:
            behavior_fired = True
            pts = round(min(1.0, refund_ratio) * c.refund_ratio_weight, 1)
            signals.append(Signal(
                "refund_concentration", "Refund / chargeback concentration", pts,
                "high" if refund_ratio > 0.4 else "medium",
                f"Refunds/chargebacks are {refund_ratio*100:.0f}% of order value."))

    # 6) creation burst
    times = [t for t in (_parse(g.nodes[a].get("created_at", "")) for a in nodes) if t]
    if len(times) >= 3:
        span_h = (max(times) - min(times)).total_seconds() / 3600.0
        if span_h <= 72:
            pts = round(c.creation_burst_weight * (1 - span_h / 72), 1)
            if pts > 0.5:
                signals.append(Signal(
                    "creation_burst", "Clustered account creation", pts, "medium",
                    f"{len(times)} accounts created within {span_h:.0f}h."))

    # 7) cross-signal bonus — independent multi-attribute linkage AND abusive
    # behavior together are jointly far more suspicious than either alone.
    if multi_attr_fired and behavior_fired:
        signals.append(Signal(
            "cross_signal", "Coordinated linkage + abusive behavior",
            round(c.cross_signal_bonus, 1), "high",
            "Multiple independent shared identifiers co-occur with abusive "
            "transaction behavior — a joint pattern that a legitimate cluster "
            "does not exhibit."))

    raw = sum(s.contribution for s in signals)
    score = round(min(c.max_score, max(0.0, raw)), 1)
    return ClusterScore(
        cluster_id=cluster_id,
        accounts=nodes,
        score=score,
        level=level_for(score),
        signals=signals,
        shared_attributes=sorted(attr_counts),
    )
