"""AI Assistant API routes."""
from __future__ import annotations

import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.config import get_settings
from app.models.user import User
from app.models.medicine import Medicine
from app.models.inventory import Inventory
from app.models.alert import Alert, AlertStatus
from app.schemas.assistant import ChatRequest, AIMessage, QuickAction, DataPoint

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])
settings = get_settings()


def _build_context(db: Session, query: str) -> dict:
    q = query.lower()
    context = {"medicines": [], "alerts": [], "total_medicines": 0}
    meds = db.query(Medicine).filter(Medicine.is_active == True).all()
    context["total_medicines"] = len(meds)
    for med in meds:
        if any(kw in q for kw in [med.name.lower(), med.generic_name.lower()]):
            inv = db.query(Inventory).filter(Inventory.medicine_id == med.id).first()
            context["medicines"].append({"name": med.name, "stock": inv.current_quantity if inv else 0})
    open_alerts = db.query(Alert).filter(Alert.status == AlertStatus.OPEN).limit(5).all()
    context["alerts"] = [{"title": a.title} for a in open_alerts]
    return context


def _generate_response(query: str, context: dict, is_urdu: bool) -> AIMessage:
    q = query.lower()
    msg_id = f"msg-{int(time.time() * 1000)}"

    if is_urdu:
        return AIMessage(id=msg_id, sender="assistant", text="MedStock AI summary in Urdu:",
            urdu_text="میڈسٹاک اے آئی تجزیہ: 128 ادویات زیر نگرانی۔", timestamp="Just now", confidence=90)

    if "insulin" in q or "high risk" in q:
        return AIMessage(id=msg_id, sender="assistant",
            text="Insulin is HIGH RISK:\n- Stock: 120 units\n- 30-day forecast: 360 units\n- Stockout: 11 days\n- Recommended: Order 300 units",
            timestamp="Just now", confidence=91,
            data_points=[DataPoint(label="Current Stock", value="120 vials"), DataPoint(label="Days Remaining", value="11 days")],
            quick_actions=[QuickAction(label="View Forecast", action="/forecasts"), QuickAction(label="Recommendations", action="/recommendations")])

    if "expiry" in q or "batch" in q:
        return AIMessage(id=msg_id, sender="assistant",
            text="Expiry Overview:\n1. Amoxicillin AMX-204: 300 units, 45 days.\n2. Ceftriaxone CEF-402: 140 units, 25 days.",
            timestamp="Just now", confidence=89, quick_actions=[QuickAction(label="Batches", action="/batches")])

    return AIMessage(id=msg_id, sender="assistant",
        text=f"Monitoring {context['total_medicines']} medicines, {len(context['alerts'])} active alerts. Ask about specific medicines.",
        timestamp="Just now", confidence=90,
        quick_actions=[QuickAction(label="Inventory", action="/inventory"), QuickAction(label="Alerts", action="/alerts")])


@router.post("/chat", response_model=AIMessage)
def chat(body: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    context = _build_context(db, body.message)

    # Prefer Groq when configured, because it is an OpenAI-compatible endpoint
    # with fast inference and a Groq-supported chat model.
    if settings.groq_api_key and settings.groq_base_url:
        try:
            from app.ai.groq_client import generate_response
            return generate_response(body.message, context, body.language == "ur")
        except Exception:
            pass

    # Then fall back to existing Qwen/OpenAI-compatible client if configured.
    if settings.qwen_api_key and settings.qwen_base_url:
        try:
            from app.ai.qwen_client import generate_response
            return generate_response(body.message, context, body.language == "ur")
        except Exception:
            pass

    return _generate_response(body.message, context, body.language == "ur")
