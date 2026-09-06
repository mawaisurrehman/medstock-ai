"""Pytest fixtures for MedStock AI tests."""
from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app

TEST_DB_URL = "sqlite:///./test_medstock.db"


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)
    eng.dispose()
    try:
        if os.path.exists("./test_medstock.db"):
            os.remove("./test_medstock.db")
    except PermissionError:
        pass  # Windows file lock - will be cleaned up next run


@pytest.fixture(scope="session")
def SessionFactory(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def client(engine, SessionFactory):
    def override_get_db():
        session = SessionFactory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    _seed_test_data(SessionFactory)

    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _seed_test_data(SessionFactory):
    from app.models.user import User, UserRole
    from app.models.facility import Facility
    from app.models.medicine import Medicine, Category
    from app.models.supplier import Supplier
    from app.models.inventory import Inventory
    from app.models.batch import Batch
    from app.models.consumption import Consumption
    from app.models.alert import Alert, AlertType, AlertSeverity, AlertStatus
    from app.models.recommendation import Recommendation, RecommendationType, RecommendationStatus
    from datetime import date, timedelta
    import random

    session = SessionFactory()
    if session.query(User).first():
        session.close()
        return

    admin = User(name="Test Admin", email="admin@test.com",
                 password_hash=hash_password("testpass123"), role=UserRole.ADMIN)
    session.add(admin)
    session.flush()

    fac_main = Facility(name="Test Hospital", code="fac-main", location="Test City",
                        facility_type="Main Hospital", bed_capacity=100)
    fac_a = Facility(name="Test Facility A", code="fac-a", location="Test Town",
                     facility_type="Secondary Facility", bed_capacity=80)
    session.add_all([fac_main, fac_a])
    session.flush()

    cat = Category(name="Antibiotics")
    session.add(cat)
    session.flush()

    sup = Supplier(name="Test Supplier", contact_email="test@sup.com",
                   phone="+92 300 1234567", city="Karachi",
                   average_lead_time_days=7, reliability_score=90)
    session.add(sup)
    session.flush()

    med_insulin = Medicine(
        name="Insulin (Regular Human 100IU/ml)", generic_name="Human Insulin",
        category_id=cat.id, unit="vials", safety_stock=50,
        unit_price=950, supplier_lead_time_days=7, default_supplier_id=sup.id,
    )
    med_amox = Medicine(
        name="Amoxicillin 500mg Capsules", generic_name="Amoxicillin",
        category_id=cat.id, unit="boxes (100s)", safety_stock=80,
        unit_price=620, supplier_lead_time_days=5, default_supplier_id=sup.id,
    )
    session.add_all([med_insulin, med_amox])
    session.flush()

    inv_insulin = Inventory(medicine_id=med_insulin.id, facility_id=fac_main.id,
                            current_quantity=120, average_daily_consumption=10.9)
    inv_amox = Inventory(medicine_id=med_amox.id, facility_id=fac_a.id,
                         current_quantity=480, average_daily_consumption=4.2)
    session.add_all([inv_insulin, inv_amox])

    today = date.today()
    random.seed(42)
    for med, daily, fac in [(med_insulin, 10.9, fac_main), (med_amox, 4.2, fac_a)]:
        running = int(daily * 100)
        for d in range(90, 0, -1):
            issued = max(0, int(daily + random.uniform(-daily * 0.3, daily * 0.3)))
            opening = running
            closing = max(0, opening - issued)
            running = closing
            session.add(Consumption(
                medicine_id=med.id, facility_id=fac.id,
                date=today - timedelta(days=d),
                opening_stock=opening, received_quantity=0,
                issued_quantity=issued, closing_stock=closing,
            ))

    session.add(Batch(
        batch_number="AMX-204", medicine_id=med_amox.id, facility_id=fac_a.id,
        quantity=300, manufacturing_date=today - timedelta(days=320),
        expiry_date=today + timedelta(days=45), unit_cost=620,
    ))
    session.add(Batch(
        batch_number="INS-891", medicine_id=med_insulin.id, facility_id=fac_main.id,
        quantity=120, manufacturing_date=today - timedelta(days=200),
        expiry_date=today + timedelta(days=193), unit_cost=950,
    ))

    alert_insulin = Alert(
        medicine_id=med_insulin.id, facility_id=fac_main.id,
        type=AlertType.STOCKOUT, severity=AlertSeverity.CRITICAL,
        title="Critical Stockout Risk - Insulin",
        description="Current stock: 120 units. Expected stockout: 11 days.",
        status=AlertStatus.OPEN, days_remaining=11,
    )
    alert_amox = Alert(
        medicine_id=med_amox.id, facility_id=fac_a.id,
        type=AlertType.EXPIRY, severity=AlertSeverity.HIGH,
        title="Expiry Risk - Batch AMX-204",
        description="Batch AMX-204: 300 units expire in 45 days.",
        status=AlertStatus.OPEN, days_remaining=45,
    )
    session.add_all([alert_insulin, alert_amox])
    session.flush()

    rec_order = Recommendation(
        medicine_id=med_insulin.id, facility_id=fac_main.id,
        type=RecommendationType.PURCHASE, quantity=300,
        reason="Stockout in 11 days. Immediate reorder required.",
        confidence=92, status=RecommendationStatus.PENDING,
        estimated_cost=285000,
    )
    rec_transfer = Recommendation(
        medicine_id=med_amox.id, facility_id=fac_a.id,
        type=RecommendationType.TRANSFER, quantity=100,
        source_facility_id=fac_a.id, destination_facility_id=fac_main.id,
        reason="Excess stock approaching expiry.",
        confidence=88, status=RecommendationStatus.PENDING,
    )
    session.add_all([rec_order, rec_transfer])
    session.commit()
    session.close()


@pytest.fixture()
def auth_headers(client):
    resp = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "testpass123"})
    token = resp.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}
