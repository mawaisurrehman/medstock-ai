"""Script to generate all test files for MedStock AI."""
import os

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))

files = {}

files["test_auth.py"] = '''\
"""Tests for authentication API."""


def test_login_success(client):
    resp = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "testpass123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "accessToken" in data
    assert data["tokenType"] == "bearer"
    assert data["user"]["email"] == "admin@test.com"
    assert data["user"]["role"] == "ADMIN"


def test_login_invalid_email(client):
    resp = client.post("/api/auth/login", json={"email": "nobody@test.com", "password": "testpass123"})
    assert resp.status_code == 401


def test_login_wrong_password(client):
    resp = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert resp.status_code == 401


def test_protected_route_without_token(client):
    resp = client.get("/api/dashboard")
    assert resp.status_code == 401


def test_protected_route_with_invalid_token(client):
    resp = client.get("/api/dashboard", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401


def test_me_endpoint(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"


def test_dashboard_with_auth(client, auth_headers):
    resp = client.get("/api/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "totalMedicines" in data
'''

files["test_forecasting.py"] = '''\
"""Tests for the forecasting engine."""
from app.forecasting.model import (
    moving_average,
    exponential_smoothing,
    forecast_demand,
    calculate_mae,
    calculate_mape,
)


def test_moving_average_basic():
    data = [10.0, 12.0, 11.0, 13.0, 14.0, 12.0, 15.0]
    result = moving_average(data, window=3)
    assert len(result) == len(data)
    assert all(p > 0 for p in result)


def test_exponential_smoothing_basic():
    data = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0]
    result = exponential_smoothing(data, alpha=0.3)
    assert len(result) == len(data)
    assert all(p > 0 for p in result)


def test_forecast_demand_full():
    data = [float(10 + i % 5) for i in range(90)]
    result = forecast_demand(data, horizon_days=30)
    assert len(result.predictions) == 30
    assert result.model_name != ""
    assert result.mae >= 0
    assert 0 <= result.mape <= 100


def test_forecast_demand_short_data():
    data = [10.0, 12.0]
    result = forecast_demand(data, horizon_days=7)
    assert len(result.predictions) == 7


def test_forecast_demand_empty():
    result = forecast_demand([], horizon_days=7)
    assert len(result.predictions) == 7


def test_calculate_mae():
    actual = [10.0, 12.0, 11.0]
    predicted = [10.5, 11.5, 11.5]
    mae = calculate_mae(actual, predicted)
    assert mae >= 0
    assert mae < 1.0


def test_calculate_mape():
    actual = [10.0, 12.0, 11.0]
    predicted = [10.5, 11.5, 11.5]
    mape = calculate_mape(actual, predicted)
    assert 0 <= mape <= 100
'''

files["test_stockout.py"] = '''\
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
'''

files["test_expiry.py"] = '''\
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
'''

files["test_recommendations.py"] = '''\
"""Tests for recommendation engine."""
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
'''

files["test_approval.py"] = '''\
"""Tests for recommendation approval workflow."""


def test_approve_recommendation(client, auth_headers):
    resp = client.post("/api/recommendations/rec-1/approve", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "APPROVED"


def test_reject_recommendation(client, auth_headers):
    resp = client.post(
        "/api/recommendations/rec-2/reject",
        headers=auth_headers,
        json={"reason": "Not needed at this time"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "REJECTED"


def test_approve_nonexistent(client, auth_headers):
    resp = client.post("/api/recommendations/rec-999/approve", headers=auth_headers)
    assert resp.status_code == 404
'''

files["test_upload.py"] = '''\
"""Tests for CSV/XLSX upload."""
import io


def test_upload_valid_csv(client, auth_headers):
    csv_content = "medicine_name,quantity,batch_number,expiry_date\\nParacetamol,500,PAR-001,2027-12-31\\n"
    files_upload = {"file": ("inventory.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    resp = client.post("/api/uploads/inventory", headers=auth_headers, files=files_upload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_upload_invalid_file_type(client, auth_headers):
    files_upload = {"file": ("inventory.exe", io.BytesIO(b"not a csv"), "application/octet-stream")}
    resp = client.post("/api/uploads/inventory", headers=auth_headers, files=files_upload)
    assert resp.status_code == 400


def test_upload_no_file(client, auth_headers):
    resp = client.post("/api/uploads/inventory", headers=auth_headers)
    assert resp.status_code == 422
'''

for name, content in files.items():
    path = os.path.join(TESTS_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {name}")

print("All test files created.")
