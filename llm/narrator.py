"""Claude narrator — the ONLY module that touches the Anthropic client.

Narration is strictly optional. If the key is missing, the API times out, the
network fails, or Claude returns malformed output, `narrate` returns None and the
caller falls back to deterministic evidence. It NEVER fabricates narration.
"""
from __future__ import annotations

import json
import os
from typing import Any

from .prompts import SYSTEM_PROMPT, build_user_prompt
from .schemas import Dossier

MODEL = os.environ.get("RING_SENTINEL_MODEL", "claude-sonnet-5")


def narrate(cluster: dict[str, Any]) -> Dossier | None:
    """Return a validated Dossier, or None if Claude is unavailable/invalid.

    `cluster` carries the deterministic engine output (score, level, signals,
    accounts, shared_attributes). Exactly one Claude call per cluster.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    try:
        import anthropic  # imported lazily so the engine never needs it
    except ImportError:
        return None

    try:
        client = anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model=MODEL,
            max_tokens=900,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": build_user_prompt(cluster)}],
        )
        text = "".join(
            block.text for block in resp.content if getattr(block, "type", "") == "text"
        )
        payload = _extract_json(text)
        # engine score is authoritative — inject, never trust the model for it
        payload["engine_score"] = cluster.get("score")
        payload["engine_level"] = cluster.get("level")
        return Dossier.model_validate(payload)
    except Exception:
        # any failure (timeout, network, malformed, forbidden action) -> degrade
        return None


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object in response")
    return json.loads(text[start : end + 1])
