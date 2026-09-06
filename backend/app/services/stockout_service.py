"""Stockout prediction service."""
from __future__ import annotations

from dataclasses import dataclass
from app.utils.calculations import calculate_days_until_stockout, classify_stockout_risk


@dataclass
class StockoutAssessment:
    days_until_stockout: int
    risk_level: str
    expected_stockout_date: str
    factors: list[dict]
    recommended_action: str


def assess_stockout_risk(
    current_stock: int,
    daily_demand: float,
    safety_stock: int,
    lead_time_days: int,
    incoming_stock: int = 0,
) -> StockoutAssessment:
    available = current_stock - 0 + incoming_stock  # reserved = 0 for simplicity
    days = calculate_days_until_stockout(available, daily_demand)
    risk = classify_stockout_risk(days, lead_time_days, safety_stock, current_stock)

    factors = [
        {"name": "Current Stock", "value": str(current_stock)},
        {"name": "Daily Demand", "value": str(round(daily_demand, 1))},
        {"name": "Days Until Stockout", "value": str(days)},
        {"name": "Supplier Lead Time", "value": f"{lead_time_days} days"},
        {"name": "Safety Stock", "value": str(safety_stock)},
    ]

    if risk == "CRITICAL":
        action = f"Immediate reorder required. Stock will deplete in {days} days."
    elif risk == "HIGH":
        action = f"Place reorder within {max(1, days - lead_time_days)} days to avoid stockout."
    elif risk == "MEDIUM":
        action = "Monitor closely. Approaching safety stock threshold."
    else:
        action = "Stock levels are adequate. Continue routine monitoring."

    from datetime import date, timedelta
    stockout_date = date.today() + timedelta(days=days)

    return StockoutAssessment(
        days_until_stockout=days,
        risk_level=risk,
        expected_stockout_date=stockout_date.isoformat(),
        factors=factors,
        recommended_action=action,
    )
