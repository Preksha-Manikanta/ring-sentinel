"""Metric computation on the untouched holdout set.

Definitions are account-level: an account is a true positive if it truly belongs
to a holdout ring AND the system flags it as part of a suspicious cluster.
"""
from __future__ import annotations

from dataclasses import dataclass

# Documented false-positive-cost assumptions.
ANALYST_REVIEW_HOURS = 1.5          # hours to review one flagged legitimate cluster
LOADED_ANALYST_HOURLY_INR = 1800.0  # loaded cost per analyst hour


@dataclass
class Result:
    precision: float
    recall: float
    inr_prevented: float
    false_positive_cost: float
    tp: int
    fp: int
    fn: int


def evaluate(
    flagged_accounts: set[str],
    holdout_true_accounts: set[str],
    all_holdout_scope: set[str],
    false_positive_clusters: int,
    inr_prevented: float,
) -> Result:
    """Restrict scoring to the holdout scope only."""
    flagged = flagged_accounts & all_holdout_scope
    truth = holdout_true_accounts & all_holdout_scope

    tp = len(flagged & truth)
    fp = len(flagged - truth)
    fn = len(truth - flagged)

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    fp_cost = false_positive_clusters * ANALYST_REVIEW_HOURS * LOADED_ANALYST_HOURLY_INR

    return Result(precision, recall, inr_prevented, fp_cost, tp, fp, fn)
