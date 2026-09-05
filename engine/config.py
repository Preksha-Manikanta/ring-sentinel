"""Tunable weights and thresholds for the deterministic risk engine.

All magic numbers live here so scoring stays explainable and reproducible.
These are tuned ONLY against the non-holdout 80% of seeded rings.
"""
from __future__ import annotations

from dataclasses import dataclass, field

# Attributes whose sharing creates a graph edge between two accounts.
LINK_ATTRIBUTES: tuple[str, ...] = (
    "device_id",
    "ip_address",
    "address",
    "card_fingerprint",
    "upi_id",
    "phone_number",
)

# Per-attribute linkage weight. Address / IP alone are weak (families, offices);
# card / device / upi / phone reuse across many accounts is far more suspicious.
ATTRIBUTE_WEIGHTS: dict[str, float] = {
    "device_id": 9.0,
    "card_fingerprint": 12.0,
    "upi_id": 10.0,
    "phone_number": 8.0,
    "ip_address": 3.0,
    "address": 2.5,
}


@dataclass(frozen=True)
class ScorerConfig:
    """Frozen deterministic scoring configuration.

    Tuned ONLY on the development rings (the non-holdout 80%) via
    `python eval/tune.py`, then frozen here before the holdout is ever scored.
    The score is the sum of clearly named, individually explainable components.
    """
    # ---- network shape -----------------------------------------------------
    min_cluster_size: int = 3          # smaller components are not "rings"
    size_weight: float = 2.0           # points per account above min size
    size_cap: float = 14.0             # size alone must never dominate the score

    # ---- attribute linkage -------------------------------------------------
    # The core discriminator: coordinated rings are linked by MULTIPLE
    # independent shared identifiers, while legitimate family/office clusters
    # share exactly ONE. This rewards the *number of independent overlaps*
    # (not merely "strong" attributes), with an extra bonus when the shared
    # identifiers are strong payment/device fingerprints.
    multi_attr_base: float = 22.0      # for exactly 2 independent shared attributes
    multi_attr_step: float = 11.0      # per independent shared attribute beyond 2
    strong_attr_bonus: float = 6.0     # per distinct STRONG shared identifier
    attr_link_cap: float = 48.0
    weak_single_attr_points: float = 2.0  # exactly one shared identifier (legit)
    strong_attr_set: frozenset[str] = field(
        default_factory=lambda: frozenset(
            {"device_id", "card_fingerprint", "upi_id", "phone_number"}
        )
    )

    # ---- behavioral signals (per-cluster, normalized over member accounts) --
    velocity_weight: float = 18.0      # scaled by (orders/account normalized)
    velocity_ref: float = 8.0          # orders/account considered "high"
    promo_ratio_weight: float = 16.0   # scaled by promo_value / amount
    refund_ratio_weight: float = 14.0  # scaled by (refund+chargeback)/amount
    creation_burst_weight: float = 8.0 # accounts created within a tight window

    # ---- cross-signal bonus ------------------------------------------------
    # Independent multi-attribute linkage AND abusive behavior TOGETHER are
    # jointly far more suspicious than either signal alone.
    cross_signal_bonus: float = 8.0

    # ---- score bands -------------------------------------------------------
    critical_threshold: float = 75.0
    high_threshold: float = 55.0
    medium_threshold: float = 35.0
    low_threshold: float = 18.0

    max_score: float = 100.0


CONFIG = ScorerConfig()


def level_for(score: float) -> str:
    c = CONFIG
    if score >= c.critical_threshold:
        return "critical"
    if score >= c.high_threshold:
        return "high"
    if score >= c.medium_threshold:
        return "medium"
    if score >= c.low_threshold:
        return "low"
    return "normal"
