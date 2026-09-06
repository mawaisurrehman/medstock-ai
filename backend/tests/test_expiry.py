"""Tests for expiry risk detection."""
from datetime import date, timedelta
from app.services.expiry_service import assess_batch_expiry


def test_expiry_45_day_scenario():
    today = date.today()
    result = assess_batch_expiry(
        batch_number="AMX-204",
        quantity=300,
        expiry_date=today + timedelta(days=45),
        daily_consumption=4.2,
    )
    assert result.risk_level in ("HIGH", "MEDIUM")
    assert result.days_to_expiry == 45
    assert result.estimated_remaining >= 0


def test_expiry_safe_scenario():
    today = date.today()
    result = assess_batch_expiry(
        batch_number="SAFE-001",
        quantity=100,
        expiry_date=today + timedelta(days=300),
        daily_consumption=10.0,
    )
    assert result.risk_level in ("LOW", "SAFE")


def test_expiry_already_expired():
    today = date.today()
    result = assess_batch_expiry(
        batch_number="EXP-001",
        quantity=50,
        expiry_date=today - timedelta(days=10),
        daily_consumption=5.0,
    )
    assert result.risk_level == "CRITICAL"
    assert result.days_to_expiry < 0
