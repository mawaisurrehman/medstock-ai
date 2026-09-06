"""Tests for stockout risk detection."""
from app.services.stockout_service import assess_stockout_risk


def test_stockout_11_day_scenario():
    result = assess_stockout_risk(
        current_stock=120,
        daily_demand=10.9,
        safety_stock=50,
        lead_time_days=7,
    )
    assert result.risk_level in ("CRITICAL", "HIGH")
    assert result.days_until_stockout <= 15
    assert len(result.factors) > 0


def test_stockout_safe_scenario():
    result = assess_stockout_risk(
        current_stock=5000,
        daily_demand=10.0,
        safety_stock=50,
        lead_time_days=7,
    )
    assert result.risk_level in ("LOW", "SAFE")
    assert result.days_until_stockout > 90


def test_stockout_zero_stock():
    result = assess_stockout_risk(
        current_stock=0,
        daily_demand=10.0,
        safety_stock=50,
        lead_time_days=7,
    )
    assert result.risk_level == "CRITICAL"
    assert result.days_until_stockout == 0
