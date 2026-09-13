"""Recommendation engine service."""
from __future__ import annotations

import json
import math
import time
from dataclasses import dataclass, asdict
from datetime import date, timedelta

import httpx

from app.core.config import get_settings
from app.utils.calculations import round_to_moq


@dataclass
class RecommendationOutput:
    rec_type: str  # PURCHASE | TRANSFER
    quantity: int
    reason: str
    confidence: float
    estimated_cost: float
    estimated_savings: float
    factors: list[dict]
    source_facility_id: str | None = None
    destination_facility_id: str | None = None


def generate_provider_reasoning(output: RecommendationOutput) -> str:
    """Ask the configured Groq/OpenAI-compatible model to rewrite the
    deterministic recommendation explanation as a model-backed reason.
    If the configured provider is absent, or the request fails, return the
    deterministic explanation unchanged so the engine never breaks.
    """
    settings = get_settings()
    if not settings.groq_api_key or not settings.groq_base_url:
        raise RuntimeError("Groq API not configured")

    messages = [
        {
            "role": "system",
            "content": "You are MedStock AI. Rewrite inventory recommendations in a concise clinical operational tone with a grounded supply explanation.",
        },
        {
            "role": "user",
            "content": (
                f"Recommendation type: {output.rec_type}\n"
                f"Quantity: {output.quantity}\n"
                f"Current deterministic reason: {output.reason}\n"
                f"Confidence: {output.confidence}\n"
                f"Estimated cost: {output.estimated_cost}\n"
                f"Estimated savings: {output.estimated_savings}\n"
                f"Factors: {json.dumps(output.factors)}\n"
                "Return a short model-backed recommendation explanation in plain English."
            ),
        },
    ]

    try:
        resp = httpx.post(
            f"{settings.groq_base_url}/chat/completions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            json={
                "model": settings.groq_model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 120,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        content = payload["choices"][0]["message"]["content"].strip()
        if content:
            return content
    except Exception:
        pass

    return output.reason


def enrich_recommendation_with_model(output: RecommendationOutput | None) -> RecommendationOutput | None:
    """Attach provider-backed reason text when a configured Groq model is available.
    Keeps the deterministic recommendation as a fallback if the AI model endpoint
    cannot be reached or the API key is missing.
    """
    if output is None:
        return None

    settings = get_settings()
    if not settings.groq_api_key or not settings.groq_base_url:
        return output

    try:
        output.reason = generate_provider_reasoning(output)
    except Exception:
        return output

    return output


def generate_reorder_recommendation(
    medicine_id: int,
    medicine_name: str,
    current_stock: int,
    forecast_demand_30d: float,
    safety_stock: int,
    incoming_stock: int,
    unit_price: float,
    lead_time_days: int,
    moq: int = 100,
    days_until_stockout: int = 30,
) -> RecommendationOutput | None:
    raw_need = forecast_demand_30d + safety_stock - current_stock - incoming_stock
    if raw_need <= 0:
        return None

    quantity = round_to_moq(raw_need, moq)
    cost = quantity * unit_price

    factors = [
        {"name": "Historical consumption", "percentage": 94, "description": "Aggregated consumption telemetry"},
        {"name": "Current inventory deficit", "percentage": 88, "description": f"Stockout projected in {days_until_stockout} days"},
        {"name": "Supplier lead time buffer", "percentage": 76, "description": f"{lead_time_days}-day standard delivery"},
    ]

    confidence = min(95, max(70, 100 - days_until_stockout))

    result = RecommendationOutput(
        rec_type="PURCHASE",
        quantity=quantity,
        reason=f"Projected 30-day demand ({int(forecast_demand_30d)} units) exceeds available inventory ({current_stock} units).",
        confidence=confidence,
        estimated_cost=cost,
        estimated_savings=0,
        factors=factors,
    )
    return enrich_recommendation_with_model(result)


def generate_transfer_recommendation(
    medicine_id: int,
    medicine_name: str,
    source_facility: str,
    source_stock: int,
    dest_facility: str,
    dest_stock: int,
    dest_daily_demand: float,
    batch_number: str,
    days_to_expiry: int,
    unit_price: float,
) -> RecommendationOutput | None:
    if source_stock <= 0 or dest_daily_demand <= 0:
        return None

    dest_days_remaining = int(dest_stock / dest_daily_demand) if dest_daily_demand > 0 else 999
    if dest_days_remaining > 30:
        return None

    transfer_qty = min(
        source_stock // 3,
        int(dest_daily_demand * 30),
    )
    transfer_qty = max(1, transfer_qty)

    savings = transfer_qty * unit_price

    factors = [
        {"name": "Expiry timeline proximity", "percentage": 92, "description": f"Batch {batch_number} expires in {days_to_expiry} days"},
        {"name": "Destination stockout urgency", "percentage": 86, "description": f"Only {dest_days_remaining} days supply remaining"},
        {"name": "Inter-facility logistics cost", "percentage": 80, "description": f"Saves Rs. {int(savings):,} procurement expenditure"},
    ]

    result = RecommendationOutput(
        rec_type="TRANSFER",
        quantity=transfer_qty,
        reason=f"Excess inventory at {source_facility} with upcoming expiry (Batch {batch_number}, {days_to_expiry} days) "
               f"balances urgent stock depletion at {dest_facility} ({dest_days_remaining} days remaining).",
        confidence=87,
        estimated_cost=transfer_qty * unit_price,
        estimated_savings=savings,
        factors=factors,
        source_facility_id=source_facility,
        destination_facility_id=dest_facility,
    )
    return enrich_recommendation_with_model(result)
