"""AI explanation service."""
from __future__ import annotations


def build_explanation(factors: list[dict], reason: str) -> dict:
    return {
        "reason": reason,
        "factors": [{"name": f.get("name", ""), "value": f.get("value", f.get("description", ""))} for f in factors],
    }
