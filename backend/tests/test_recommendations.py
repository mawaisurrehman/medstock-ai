"""Tests for recommendation engine."""
from app.services import recommendation_service
from app.services.recommendation_service import (
    generate_reorder_recommendation,
    generate_transfer_recommendation,
)


def test_reorder_insulin():
    result = generate_reorder_recommendation(
        medicine_id=1,
        medicine_name="Insulin (Regular Human 100IU/ml)",
        current_stock=120,
        forecast_demand_30d=360,
        safety_stock=50,
        incoming_stock=0,
        unit_price=950,
        lead_time_days=7,
        moq=100,
        days_until_stockout=11,
    )
    assert result is not None
    assert result.quantity >= 200
    assert result.rec_type == "PURCHASE"
    assert result.confidence > 0
    assert len(result.factors) > 0


def test_transfer_amox():
    result = generate_transfer_recommendation(
        medicine_id=2,
        medicine_name="Amoxicillin 500mg Capsules",
        source_facility="Facility A",
        source_stock=300,
        dest_facility="Main Hospital",
        dest_stock=50,
        dest_daily_demand=10.0,
        batch_number="AMX-204",
        days_to_expiry=45,
        unit_price=620,
    )
    assert result is not None
    assert result.quantity > 0
    assert result.rec_type == "TRANSFER"


def test_ai_recommendation_enrichment_uses_provider_when_available(monkeypatch):
    class StubSettings:
        groq_api_key = "stub-groq-key"
        groq_base_url = "https://api.groq.com/openai/v1"
        groq_model = "openai/gpt-oss-20b"
        qwen_api_key = ""
        qwen_base_url = ""
        qwen_model = ""

    monkeypatch.setattr(recommendation_service, "get_settings", lambda: StubSettings())

    def fake_generate_reason(*args, **kwargs):
        return "Groq-backed reasoning: stockout risk is elevated and procurement should be prioritized."

    monkeypatch.setattr(recommendation_service, "generate_provider_reasoning", fake_generate_reason)

    result = generate_reorder_recommendation(
        medicine_id=1,
        medicine_name="Insulin",
        current_stock=120,
        forecast_demand_30d=360,
        safety_stock=50,
        incoming_stock=0,
        unit_price=950,
        lead_time_days=7,
        moq=100,
        days_until_stockout=11,
    )
    enriched = recommendation_service.enrich_recommendation_with_model(result)

    assert enriched.reason.startswith("Groq-backed reasoning:")


def test_no_reorder_when_sufficient_stock():
    result = generate_reorder_recommendation(
        medicine_id=3,
        medicine_name="Test Med",
        current_stock=5000,
        forecast_demand_30d=100,
        safety_stock=50,
        incoming_stock=0,
        unit_price=100,
        lead_time_days=7,
        moq=50,
    )
    assert result is None
