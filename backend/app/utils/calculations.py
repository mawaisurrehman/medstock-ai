"""Calculation utilities."""
from __future__ import annotations

import math


def calculate_days_until_stockout(available_stock: int, daily_demand: float) -> int:
    if daily_demand <= 0:
        return 999
    return max(0, int(available_stock / daily_demand))


def classify_stockout_risk(
    days_until_stockout: int,
    lead_time_days: int,
    safety_stock: int,
    current_stock: int,
) -> str:
    if days_until_stockout <= lead_time_days:
        return "CRITICAL"
    if days_until_stockout <= lead_time_days * 2:
        return "HIGH"
    if current_stock <= safety_stock:
        return "MEDIUM"
    return "LOW" if current_stock > safety_stock * 2 else "MEDIUM"


def classify_expiry_risk(days_to_expiry: int) -> str:
    if days_to_expiry < 0:
        return "CRITICAL"
    if days_to_expiry <= 30:
        return "CRITICAL"
    if days_to_expiry <= 60:
        return "HIGH"
    if days_to_expiry <= 90:
        return "MEDIUM"
    return "LOW"


def round_to_moq(quantity: float, moq: int = 1) -> int:
    if moq <= 0:
        return max(1, math.ceil(quantity))
    return max(moq, math.ceil(quantity / moq) * moq)
