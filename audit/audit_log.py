"""Append-only, hash-chained JSONL audit log.

Every human action is recorded with the hash of the previous record folded into
the current record's hash. Tampering with any earlier record breaks verification
of every record after it.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

LOG_PATH = Path(__file__).resolve().parent.parent / "logs" / "audit.jsonl"
GENESIS = "0" * 64


def _canonical(record: dict[str, Any]) -> str:
    # deterministic serialization for stable hashing (exclude current_hash)
    payload = {k: record[k] for k in record if k != "current_hash"}
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def _hash(record: dict[str, Any]) -> str:
    return hashlib.sha256(_canonical(record).encode("utf-8")).hexdigest()


def _last_hash(path: Path) -> str:
    if not path.exists():
        return GENESIS
    last = GENESIS
    with path.open() as fh:
        for line in fh:
            line = line.strip()
            if line:
                last = json.loads(line).get("current_hash", last)
    return last


def append_event(
    case_id: str,
    event_type: str,
    action: str,
    evidence: dict[str, Any] | None = None,
    actor: str = "analyst",
    path: Path = LOG_PATH,
) -> dict[str, Any]:
    """Append one hash-chained event and return it (including its hash)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "case_id": case_id,
        "event_type": event_type,
        "action": action,
        "actor": actor,
        "evidence": evidence or {},
        "previous_hash": _last_hash(path),
    }
    record["current_hash"] = _hash(record)
    with path.open("a") as fh:
        fh.write(json.dumps(record) + "\n")
    return record


def read_log(path: Path = LOG_PATH) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open() as fh:
        return [json.loads(line) for line in fh if line.strip()]


def verify_chain(path: Path = LOG_PATH) -> tuple[bool, int | None]:
    """Verify the chain. Returns (ok, first_broken_index)."""
    prev = GENESIS
    for i, record in enumerate(read_log(path)):
        if record.get("previous_hash") != prev:
            return False, i
        if _hash(record) != record.get("current_hash"):
            return False, i
        prev = record["current_hash"]
    return True, None
