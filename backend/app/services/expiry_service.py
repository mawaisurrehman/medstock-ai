"""Expiry risk detection service."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.utils.calculations import classify_expiry_risk


@dataclass
class ExpiryAssessment:
    batch_number: str
    quantity: int
    days_to_expiry: int
    risk_level: str
    estimated_consumption_until_expiry: int
    estimated_remaining: int
    recommended_action: str


def assess_batch_expiry(
    batch_number: str,
    quantity: int,
    expiry_date: date,
    daily_consumption: float,
) -> ExpiryAssessment:
    dte = (expiry_date - date.today()).days
    risk = classify_expiry_risk(dte)

    consumable_days = max(0, dte)
    est_consumption = int(daily_consumption * consumable_days)
    est_remaining = max(0, quantity - est_consumption)

    if risk == "CRITICAL" and dte < 0:
        action = "Quarantine immediately. Initiate safe disposal protocol."
    elif risk == "CRITICAL":
        action = f"Urgent: {est_remaining} units at risk of expiry. Transfer to high-demand facility."
    elif risk == "HIGH":
        action = f"Transfer {min(est_remaining, quantity // 3)} units to high-demand facility to prevent waste."
    elif risk == "MEDIUM":
        action = "Monitor consumption. Consider inter-facility transfer if consumption slows."
    else:
        action = "Normal FIFO dispensing. No expiry concern."

    return ExpiryAssessment(
        batch_number=batch_number,
        quantity=quantity,
        days_to_expiry=dte,
        risk_level=risk,
        estimated_consumption_until_expiry=est_consumption,
        estimated_remaining=est_remaining,
        recommended_action=action,
    )
