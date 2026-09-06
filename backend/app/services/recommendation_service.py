"""Recommendation engine service."""
from __future__ import annotations

import json
import math
from dataclasses import dataclass, asdict
from datetime import date, timedelta

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

    return RecommendationOutput(
        rec_type="PURCHASE",
        quantity=quantity,
        reason=f"Projected 30-day demand ({int(forecast_demand_30d)} units) exceeds available inventory ({current_stock} units).",
        confidence=confidence,
        estimated_cost=cost,
        estimated_savings=0,
        factors=factors,
    )


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

    return RecommendationOutput(
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
