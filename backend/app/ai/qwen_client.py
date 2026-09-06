"""Qwen AI client abstraction."""
from __future__ import annotations

import time
import httpx
from app.core.config import get_settings
from app.schemas.assistant import AIMessage
from app.ai.prompts import SYSTEM_PROMPT


def generate_response(query: str, context: dict, is_urdu: bool = False) -> AIMessage:
    settings = get_settings()
    if not settings.qwen_api_key:
        raise RuntimeError("Qwen API not configured")

    lang = "Respond in Urdu." if is_urdu else "Respond in English."
    ctx_lines = []
    for med in context.get("medicines", []):
        ctx_lines.append(f"Medicine: {med['name']}, Stock: {med.get('stock', 'unknown')}")
    for alert in context.get("alerts", []):
        ctx_lines.append(f"Alert: {alert.get('title', '')}")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Context:\n{chr(10).join(ctx_lines)}\n\nQuestion: {query}\n\n{lang}"},
    ]

    resp = httpx.post(
        f"{settings.qwen_base_url}/chat/completions",
        headers={"Authorization": f"Bearer {settings.qwen_api_key}"},
        json={"model": settings.qwen_model, "messages": messages, "temperature": 0.3},
        timeout=30.0,
    )
    resp.raise_for_status()
    text = resp.json()["choices"][0]["message"]["content"]
    return AIMessage(id=f"msg-{int(time.time()*1000)}", sender="assistant", text=text, timestamp="Just now", confidence=85)
