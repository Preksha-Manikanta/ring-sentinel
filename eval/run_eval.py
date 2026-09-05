"""Side-by-side holdout evaluation: naive baseline vs Ring Sentinel.

Run: python eval/run_eval.py

Weights/thresholds in engine/config.py are tuned only on the 80% non-holdout
rings. Everything printed here is computed ONLY on the untouched 20% holdout.
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

# allow `python eval/run_eval.py` from repo root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine.config import CONFIG  # noqa: E402
from engine.graph_builder import load_accounts, load_orders  # noqa: E402
from engine.pipeline import Engine  # noqa: E402
from eval.baseline import baseline_clusters  # noqa: E402
from eval.metrics import Result, evaluate  # noqa: E402

DATA = Path(__file__).resolve().parent.parent / "data"
FLAG_CUTOFF = CONFIG.high_threshold


def _inr_in_rings(rings_caught: set[str], account_true_ring: dict[str, str],
                  orders: list[dict]) -> float:
    caught_accounts = {a for a, r in account_true_ring.items() if r in rings_caught}
    total = 0.0
    for o in orders:
        if o["account_id"] in caught_accounts:
            total += o["promo_value"] + o["refund_value"]
    return round(total, 2)


def _result_dict(r: Result) -> dict:
    return {
        "precision": round(r.precision, 4),
        "recall": round(r.recall, 4),
        "rupeesPrevented": r.inr_prevented,
        "falsePositiveCost": r.false_positive_cost,
        "tp": r.tp, "fp": r.fp, "fn": r.fn,
    }


def compute_evaluation() -> dict:
    """Compute the holdout evaluation results as a serializable dict.

    Single source of truth shared by the CLI (`main`) and the API `/metrics`
    endpoint. All numbers are computed on the untouched 20% holdout; nothing is
    hard-coded.
    """
    accounts = load_accounts(DATA / "accounts.csv")
    orders = load_orders(DATA / "orders.csv")
    holdout = json.loads((DATA / "holdout_labels.json").read_text())

    account_true_ring: dict[str, str] = holdout["account_true_ring"]
    holdout_rings = set(holdout["holdout_ring_ids"])

    holdout_true_accounts = {
        a for a, r in account_true_ring.items() if r in holdout_rings
    }
    # scope: holdout ring accounts (positives) + all legitimate accounts (negatives)
    legit_accounts = {
        a["account_id"] for a in accounts if not a.get("true_ring_id")
    }
    scope = holdout_true_accounts | legit_accounts
    all_true_ring_accounts = set(account_true_ring)

    def summarize(flagged_clusters: list[set[str]]) -> Result:
        flagged_accounts: set[str] = set()
        for c in flagged_clusters:
            flagged_accounts |= c
        # false-positive clusters: flagged clusters containing no true ring account
        fp_clusters = sum(
            1 for c in flagged_clusters
            if (c & scope) and not (c & all_true_ring_accounts)
        )
        # rings caught within holdout
        caught = set()
        for c in flagged_clusters:
            for acct in c:
                r = account_true_ring.get(acct)
                if r in holdout_rings:
                    caught.add(r)
        inr = _inr_in_rings(caught, account_true_ring, orders)
        return evaluate(flagged_accounts, holdout_true_accounts, scope,
                        fp_clusters, inr)

    base = summarize(baseline_clusters(accounts))
    engine = Engine(accounts, orders)
    rs = summarize([
        set(c.accounts) for c in engine.clusters() if c.score >= FLAG_CUTOFF
    ])
    seeded = len({r for r in account_true_ring.values()})

    return {
        "datasetAccounts": len(accounts),
        "datasetOrders": len(orders),
        "seededRings": seeded,
        "holdoutRings": sorted(holdout_rings),
        "holdoutFraction": round(len(holdout_rings) / seeded, 2) if seeded else 0.0,
        "flagCutoff": FLAG_CUTOFF,
        "baseline": _result_dict(base),
        "ringSentinel": _result_dict(rs),
    }


def main() -> None:
    ev = compute_evaluation()
    base = Result(ev["baseline"]["precision"], ev["baseline"]["recall"],
                  ev["baseline"]["rupeesPrevented"],
                  ev["baseline"]["falsePositiveCost"],
                  ev["baseline"]["tp"], ev["baseline"]["fp"], ev["baseline"]["fn"])
    rs = Result(ev["ringSentinel"]["precision"], ev["ringSentinel"]["recall"],
                ev["ringSentinel"]["rupeesPrevented"],
                ev["ringSentinel"]["falsePositiveCost"],
                ev["ringSentinel"]["tp"], ev["ringSentinel"]["fp"],
                ev["ringSentinel"]["fn"])
    seeded = ev["seededRings"]
    holdout_rings = set(ev["holdoutRings"])
    accounts_n = ev["datasetAccounts"]
    orders_n = ev["datasetOrders"]
    print("=" * 56)
    print("RING SENTINEL — HOLDOUT EVALUATION")
    print("=" * 56)
    print(f"\nAccounts: {accounts_n}")
    print(f"Orders: {orders_n}")
    print(f"Seeded rings: {seeded}")
    print(f"Holdout rings: {sorted(holdout_rings)} ({len(holdout_rings)})")
    print(f"Flag cutoff (Ring Sentinel score): {FLAG_CUTOFF}\n")
    print(f"{'':<24}{'BASELINE':<14}{'RING SENTINEL'}")
    print("-" * 52)
    print(f"{'Precision':<24}{base.precision*100:>6.1f}%{'':<7}{rs.precision*100:>6.1f}%")
    print(f"{'Recall':<24}{base.recall*100:>6.1f}%{'':<7}{rs.recall*100:>6.1f}%")
    print(f"{'INR Prevented*':<24}{'INR '+format(base.inr_prevented,',.0f'):<14}"
          f"{'INR '+format(rs.inr_prevented,',.0f')}")
    print(f"{'False-positive cost':<24}{'INR '+format(base.false_positive_cost,',.0f'):<14}"
          f"{'INR '+format(rs.false_positive_cost,',.0f')}")
    print("-" * 52)
    print("* simulated / pre-payout prevented value within caught rings.")
    print(f"  FP cost = wrongly-flagged legit clusters x 1.5h x INR 1800/h.")
    print(f"\nBaseline TP/FP/FN: {base.tp}/{base.fp}/{base.fn}")
    print(f"Ring Sentinel TP/FP/FN: {rs.tp}/{rs.fp}/{rs.fn}")


if __name__ == "__main__":
    main()
