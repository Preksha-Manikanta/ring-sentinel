"""Deterministic synthetic dataset generator for Ring Sentinel.

Produces accounts.csv, orders.csv and holdout_labels.json. Uses a fixed seed so
the dataset — and therefore every downstream score — is fully reproducible.

This is the ONLY place data is fabricated, and it is legitimate: it is the
evaluation dataset, clearly labelled synthetic, never presented in the UI as
live production traffic. The engine never reads the ground-truth labels.
"""
from __future__ import annotations

import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

SEED = 20240517
N_ACCOUNTS = 500
N_ORDERS = 2000
HERE = Path(__file__).resolve().parent

CITIES = ["Bengaluru", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata"]
CHANNELS = ["UPI", "CARD", "NETBANKING", "WALLET"]
EPOCH = datetime(2024, 1, 1)

SHARED_ATTRS = [
    "device_id",
    "ip_address",
    "address",
    "card_fingerprint",
    "upi_id",
    "phone_number",
]


def _ts(rng: random.Random, base_days: int, jitter_h: int = 72) -> str:
    dt = EPOCH + timedelta(days=base_days, hours=rng.randint(0, jitter_h),
                           minutes=rng.randint(0, 59), seconds=rng.randint(0, 59))
    return dt.isoformat()


def _blank_attrs(rng: random.Random, i: int) -> dict:
    return {
        "device_id": f"dev_{rng.randint(10_000, 99_999)}",
        "ip_address": f"10.{rng.randint(0,255)}.{rng.randint(0,255)}.{rng.randint(1,254)}",
        "address": f"addr_{rng.randint(1000, 9999)}",
        "card_fingerprint": f"card_{rng.randint(100000, 999999)}",
        "upi_id": f"user{i}@okbank",
        "phone_number": f"+9198{rng.randint(10_000_000, 99_999_999)}",
    }


def generate() -> None:
    rng = random.Random(SEED)
    accounts: list[dict] = []
    account_true_ring: dict[str, str] = {}
    idx = 0

    def new_account(segment: str, ring_id: str = "") -> dict:
        nonlocal idx
        idx += 1
        acct = {"account_id": f"acct_{idx:04d}", "segment": segment,
                "true_ring_id": ring_id, "created_at": _ts(rng, rng.randint(0, 300)),
                **_blank_attrs(rng, idx)}
        accounts.append(acct)
        if ring_id:
            account_true_ring[acct["account_id"]] = ring_id
        return acct

    # ---- seeded abuse rings ------------------------------------------------
    n_rings = rng.randint(6, 8)
    ring_ids = [f"ring_{r:02d}" for r in range(1, n_rings + 1)]
    ring_accounts: dict[str, list[dict]] = {}
    for ring_id in ring_ids:
        size = rng.randint(4, 12)
        # pick >= 2 attributes the whole ring will share (hidden linkage)
        shared = rng.sample(SHARED_ATTRS, rng.randint(2, 3))
        shared_values = {a: _blank_attrs(rng, idx + 1)[a] for a in shared}
        base_day = rng.randint(0, 260)
        members = []
        for _ in range(size):
            acct = new_account("ring", ring_id)
            for a, v in shared_values.items():
                acct[a] = v
            # clustered creation timing
            acct["created_at"] = _ts(rng, base_day, jitter_h=36)
            members.append(acct)
        ring_accounts[ring_id] = members

    # ---- legitimate look-alike traps --------------------------------------
    # family: shares address only
    for f in range(6):
        addr = f"addr_fam_{f}"
        for _ in range(rng.randint(2, 4)):
            acct = new_account("family")
            acct["address"] = addr
    # office: shares IP only
    for o in range(5):
        ip = f"172.16.{o}.{rng.randint(2, 250)}"
        for _ in range(rng.randint(4, 9)):
            acct = new_account("office")
            acct["ip_address"] = ip
    # single-attribute incidental overlap (one shared device between two accounts)
    for _ in range(8):
        dev = f"dev_shared_{rng.randint(1000,9999)}"
        a = new_account("organic")
        b = new_account("organic")
        a["device_id"] = b["device_id"] = dev

    # ---- fill the rest with organic accounts ------------------------------
    while len(accounts) < N_ACCOUNTS:
        new_account("organic")

    # ---- orders ------------------------------------------------------------
    orders: list[dict] = []
    oid = 0

    def emit_order(acct: dict, abusive: bool) -> None:
        nonlocal oid
        oid += 1
        if abusive:
            amount = round(rng.uniform(1500, 12000), 2)
            promo = round(amount * rng.uniform(0.35, 0.7), 2)
            roll = rng.random()
            status = "chargeback" if roll < 0.18 else ("refunded" if roll < 0.5 else "captured")
        else:
            amount = round(rng.uniform(200, 6000), 2)
            promo = round(amount * rng.uniform(0, 0.12), 2) if rng.random() < 0.25 else 0.0
            roll = rng.random()
            status = "refunded" if roll < 0.05 else "captured"
        refund = round(amount * rng.uniform(0.4, 1.0), 2) if status in ("refunded", "chargeback") else 0.0
        orders.append({
            "order_id": f"ord_{oid:05d}", "account_id": acct["account_id"],
            "created_at": _ts(rng, rng.randint(0, 300)), "amount": amount,
            "promo_value": promo, "refund_value": refund, "status": status,
            "channel": rng.choice(CHANNELS), "location": rng.choice(CITIES),
        })

    # ring accounts transact with high velocity
    for members in ring_accounts.values():
        for acct in members:
            for _ in range(rng.randint(6, 12)):
                emit_order(acct, abusive=True)
    # everyone else, spread remaining budget
    others = [a for a in accounts if a["segment"] != "ring"]
    while oid < N_ORDERS:
        emit_order(rng.choice(others), abusive=False)

    # ---- holdout: 20% of rings, untouched ---------------------------------
    n_holdout = max(1, round(len(ring_ids) * 0.2))
    holdout_rings = sorted(rng.sample(ring_ids, n_holdout))
    holdout = {
        "holdout_ring_ids": holdout_rings,
        "account_true_ring": account_true_ring,
        "note": "Metrics are computed only on holdout_ring_ids. Engine weights "
                "are tuned only on the complementary 80%.",
    }

    # ---- write -------------------------------------------------------------
    acct_cols = ["account_id", "created_at", "device_id", "ip_address", "address",
                 "card_fingerprint", "upi_id", "phone_number", "segment", "true_ring_id"]
    with (HERE / "accounts.csv").open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=acct_cols)
        w.writeheader()
        w.writerows(accounts)
    order_cols = ["order_id", "account_id", "created_at", "amount", "promo_value",
                  "refund_value", "status", "channel", "location"]
    with (HERE / "orders.csv").open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=order_cols)
        w.writeheader()
        w.writerows(orders)
    with (HERE / "holdout_labels.json").open("w") as fh:
        json.dump(holdout, fh, indent=2)

    print(f"accounts={len(accounts)} orders={len(orders)} rings={len(ring_ids)} "
          f"holdout={holdout_rings}")


if __name__ == "__main__":
    generate()
