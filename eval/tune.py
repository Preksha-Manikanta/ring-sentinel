"""Development-only tuning validation for the frozen scoring config.

Run: python eval/tune.py

METHODOLOGY GUARANTEE
---------------------
This script reads ONLY the development rings — the non-holdout 80%. It never
scores, inspects, or reports the holdout rings, so the frozen weights in
`engine/config.py` cannot be tuned against the holdout. It reports how well the
frozen configuration separates known development rings from legitimate
family/office/organic clusters, which is the evidence used to *freeze* the
config BEFORE `eval/run_eval.py` is ever run on the untouched holdout.

If this separation is poor, improve signal quality in engine/risk_scorer.py and
engine/config.py using ONLY what you see here — then freeze and evaluate.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine.config import CONFIG  # noqa: E402
from engine.graph_builder import load_accounts, load_orders  # noqa: E402
from engine.pipeline import Engine  # noqa: E402

DATA = Path(__file__).resolve().parent.parent / "data"


def main() -> None:
    accounts = load_accounts(DATA / "accounts.csv")
    orders = load_orders(DATA / "orders.csv")
    holdout = json.loads((DATA / "holdout_labels.json").read_text())

    account_true_ring: dict[str, str] = holdout["account_true_ring"]
    holdout_rings = set(holdout["holdout_ring_ids"])

    # DEVELOPMENT rings only — holdout is excluded from everything below.
    dev_ring_accounts = {
        a for a, r in account_true_ring.items()
        if r and r not in holdout_rings
    }
    holdout_accounts = {
        a for a, r in account_true_ring.items() if r in holdout_rings
    }
    legit_accounts = {a["account_id"] for a in accounts if not a.get("true_ring_id")}

    engine = Engine(accounts, orders)
    dev_ring_scores: list[float] = []
    legit_scores: list[float] = []
    leaked = 0

    for c in engine.clusters():
        acc = set(c.accounts)
        if acc & holdout_accounts:
            leaked += 1  # must never happen in tuning output
            continue
        if acc & dev_ring_accounts:
            dev_ring_scores.append(c.score)
        elif acc & legit_accounts:
            legit_scores.append(c.score)

    cutoff = CONFIG.high_threshold

    def stats(xs: list[float]) -> str:
        if not xs:
            return "n=0"
        return (f"n={len(xs)} min={min(xs):.1f} "
                f"median={sorted(xs)[len(xs)//2]:.1f} max={max(xs):.1f}")

    dev_caught = sum(1 for s in dev_ring_scores if s >= cutoff)
    legit_flagged = sum(1 for s in legit_scores if s >= cutoff)

    print("=" * 56)
    print("RING SENTINEL — DEVELOPMENT TUNING (holdout excluded)")
    print("=" * 56)
    print(f"\nFlag cutoff (frozen): {cutoff}")
    print(f"Holdout rings EXCLUDED from this report: {sorted(holdout_rings)}")
    if leaked:
        print(f"!! WARNING: {leaked} holdout clusters leaked and were skipped.")
    print(f"\nDevelopment ring clusters:  {stats(dev_ring_scores)}")
    print(f"Legitimate clusters:        {stats(legit_scores)}")
    print(f"\nDev rings caught (score >= {cutoff}): "
          f"{dev_caught}/{len(dev_ring_scores)}")
    print(f"Legit clusters wrongly flagged: "
          f"{legit_flagged}/{len(legit_scores)}")
    print("\nFreeze the config only when dev separation is strong, THEN run")
    print("`python eval/run_eval.py` on the untouched holdout.")


if __name__ == "__main__":
    main()
