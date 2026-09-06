"""Seed database with demo data matching frontend mock data."""
from __future__ import annotations

import json
import random
from datetime import date, timedelta, datetime, timezone

from app.core.database import SessionLocal, create_tables
from app.core.security import hash_password
from app.models import (
    User, UserRole, Facility, Medicine, Category, Supplier,
    Inventory, Batch, Consumption, Forecast, Alert, AlertType,
    AlertSeverity, AlertStatus, Recommendation, RecommendationType,
    RecommendationStatus, Notification,
)


DEMO_PASSWORD = "medstock2026"


def seed():
    """Populate the database with demo data."""
    create_tables()
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding database...")

    # --- Users ---
    users = [
        User(name="Dr. Tariq Mahmood", email="admin@medstock.ai", password_hash=hash_password(DEMO_PASSWORD), role=UserRole.ADMIN),
        User(name="Zubair Ahmed", email="manager@medstock.ai", password_hash=hash_password(DEMO_PASSWORD), role=UserRole.STORE_MANAGER),
        User(name="Fatima Noor", email="procurement@medstock.ai", password_hash=hash_password(DEMO_PASSWORD), role=UserRole.PROCUREMENT_OFFICER),
        User(name="Dr. Sameera Raza", email="hospital@medstock.ai", password_hash=hash_password(DEMO_PASSWORD), role=UserRole.HOSPITAL_ADMIN),
    ]
    db.add_all(users)
    db.flush()

    # --- Facilities ---
    facilities = [
        Facility(name="Main Hospital", code="fac-main", location="Karachi Central District", facility_type="Main Hospital",
                 contact_person="Zubair Ahmed (Chief Pharmacist)", phone="+92 21 3568 2000", bed_capacity=150),
        Facility(name="Facility A", code="fac-a", location="Lahore Medical Zone", facility_type="Secondary Facility",
                 contact_person="Asad Khan (Store Incharge)", phone="+92 42 3789 1100", bed_capacity=120),
        Facility(name="Facility B", code="fac-b", location="Islamabad Healthcare Sector", facility_type="Specialized Center",
                 contact_person="Dr. Sameera Raza (Procurement)", phone="+92 51 9260 400", bed_capacity=90),
        Facility(name="Clinic C", code="fac-c", location="Rawalpindi Outpatient Center", facility_type="Community Clinic",
                 contact_person="Kashif Ali (Dispenser)", phone="+92 51 5552 100", bed_capacity=40),
    ]
    db.add_all(facilities)
    db.flush()
    fac_map = {f.code: f for f in facilities}

    # --- Categories ---
    categories = {}
    for name in ["Diabetes", "Antibiotics", "Analgesics", "Cardiovascular", "Respiratory", "Gastrointestinal"]:
        cat = Category(name=name)
        db.add(cat)
        db.flush()
        categories[name] = cat

    # --- Suppliers ---
    suppliers = [
        Supplier(name="MediSupply Pakistan", contact_email="orders@medisupply.pk", phone="+92 21 3455 8899",
                 city="Karachi", average_lead_time_days=7, reliability_score=94, quality_rating=4.8, status="Preferred"),
        Supplier(name="Khyber Pharma Distribution", contact_email="sales@khyberpharma.com", phone="+92 91 5840 300",
                 city="Peshawar", average_lead_time_days=10, reliability_score=91, quality_rating=4.4, status="Active"),
        Supplier(name="Indus Healthcare Logistics", contact_email="logistics@indushealth.org.pk", phone="+92 21 3511 2233",
                 city="Karachi", average_lead_time_days=5, reliability_score=97, quality_rating=4.9, status="Preferred"),
        Supplier(name="Punjab MedCorp Ltd", contact_email="tenders@punjabmedcorp.pk", phone="+92 42 3571 6000",
                 city="Lahore", average_lead_time_days=8, reliability_score=89, quality_rating=4.2, status="Active"),
    ]
    db.add_all(suppliers)
    db.flush()

    # --- Medicines ---
    medicines_data = [
        {"name": "Insulin (Regular Human 100IU/ml)", "generic": "Human Insulin Recombinant", "cat": "Diabetes",
         "unit": "vials", "price": 950, "safety": 50, "lead": 7,
         "desc": "Critical life-saving injectable hormone for diabetic emergencies."},
        {"name": "Amoxicillin 500mg Capsules", "generic": "Amoxicillin Trihydrate", "cat": "Antibiotics",
         "unit": "boxes (100s)", "price": 620, "safety": 80, "lead": 5,
         "desc": "First-line broad-spectrum antibiotic for bacterial infections."},
        {"name": "Ceftriaxone 1g Injection", "generic": "Ceftriaxone Sodium IV/IM", "cat": "Antibiotics",
         "unit": "vials", "price": 420, "safety": 100, "lead": 4,
         "desc": "Third-generation cephalosporin for severe infections."},
        {"name": "Paracetamol 500mg Tablets", "generic": "Acetaminophen", "cat": "Analgesics",
         "unit": "blisters (10s)", "price": 45, "safety": 500, "lead": 3,
         "desc": "Standard antipyretic and analgesic tablet."},
        {"name": "Metformin 500mg Tablets", "generic": "Metformin Hydrochloride", "cat": "Diabetes",
         "unit": "boxes (100s)", "price": 380, "safety": 150, "lead": 6,
         "desc": "First-line oral antihyperglycemic for Type 2 diabetes."},
        {"name": "Azithromycin 250mg Tablets", "generic": "Azithromycin Dihydrate", "cat": "Antibiotics",
         "unit": "packs (6s)", "price": 310, "safety": 40, "lead": 4,
         "desc": "Macrolide antibiotic for atypical pneumonia."},
        {"name": "Omeprazole 20mg Capsules", "generic": "Omeprazole Magnesium", "cat": "Gastrointestinal",
         "unit": "boxes (14s)", "price": 220, "safety": 200, "lead": 4,
         "desc": "Proton-pump inhibitor for peptic ulcer disease."},
        {"name": "Salbutamol 100mcg Inhaler", "generic": "Albuterol Sulfate", "cat": "Respiratory",
         "unit": "canisters", "price": 480, "safety": 30, "lead": 5,
         "desc": "Short-acting rescue inhaler for acute asthma."},
        {"name": "Amlodipine 5mg Tablets", "generic": "Amlodipine Besylate", "cat": "Cardiovascular",
         "unit": "strips (10s)", "price": 140, "safety": 120, "lead": 5,
         "desc": "Calcium channel blocker for chronic hypertension."},
        {"name": "Atorvastatin 20mg Tablets", "generic": "Atorvastatin Calcium", "cat": "Cardiovascular",
         "unit": "boxes (30s)", "price": 520, "safety": 100, "lead": 6,
         "desc": "Statin for hypercholesterolemia."},
    ]

    med_objects = []
    for md in medicines_data:
        med = Medicine(
            name=md["name"], generic_name=md["generic"], category_id=categories[md["cat"]].id,
            unit=md["unit"], safety_stock=md["safety"], unit_price=md["price"],
            supplier_lead_time_days=md["lead"], description=md["desc"],
            default_supplier_id=suppliers[0].id,
        )
        db.add(med)
        db.flush()
        med_objects.append(med)

    # Map medicine IDs to match frontend mock data
    # med-1=Insulin, med-2=Amoxicillin, etc.

    # --- Inventory + Consumption ---
    inv_configs = [
        (0, "fac-main", 120, 10.9),    # Insulin @ Main Hospital
        (1, "fac-a", 480, 4.2),         # Amoxicillin @ Facility A
        (2, "fac-main", 340, 24.5),     # Ceftriaxone @ Main Hospital
        (3, "fac-main", 2400, 45.0),    # Paracetamol @ Main Hospital
        (4, "fac-b", 580, 14.2),        # Metformin @ Facility B
        (5, "fac-c", 65, 5.8),          # Azithromycin @ Clinic C
        (6, "fac-main", 1100, 18.5),    # Omeprazole @ Main Hospital
        (7, "fac-a", 45, 6.2),          # Salbutamol @ Facility A
        (8, "fac-b", 820, 12.0),        # Amlodipine @ Facility B
        (9, "fac-main", 410, 9.4),      # Atorvastatin @ Main Hospital
    ]

    today = date.today()
    for med_idx, fac_code, stock, daily in inv_configs:
        med = med_objects[med_idx]
        fac = fac_map[fac_code]
        inv = Inventory(
            medicine_id=med.id, facility_id=fac.id,
            current_quantity=stock, average_daily_consumption=daily,
        )
        db.add(inv)

        # Generate 90 days of consumption history
        running_stock = stock + int(daily * 90)
        for d in range(90, 0, -1):
            consumption_date = today - timedelta(days=d)
            issued = max(0, int(daily + random.uniform(-daily * 0.3, daily * 0.3)))
            opening = running_stock
            received = random.choice([0, 0, 0, 0, int(daily * 7)])  # occasional restock
            closing = max(0, opening + received - issued)
            running_stock = closing

            cons = Consumption(
                medicine_id=med.id, facility_id=fac.id,
                date=consumption_date, opening_stock=opening,
                received_quantity=received, issued_quantity=issued,
                closing_stock=closing, patient_count=random.randint(50, 200),
            )
            db.add(cons)

    # Ensure last consumption record matches current stock
    db.flush()

    # --- Batches ---
    today_plus = lambda d: today + timedelta(days=d)
    batches_data = [
        ("AMX-204", 1, "fac-a", 300, today_plus(45), 620),
        ("INS-891", 0, "fac-main", 120, today_plus(193), 950),
        ("CEF-402", 2, "fac-main", 140, today_plus(25), 420),
        ("SAL-012", 7, "fac-a", 45, today_plus(70), 480),
        ("AZI-771", 5, "fac-c", 65, today_plus(41), 310),
        ("ATV-109", 9, "fac-main", 110, today_plus(78), 520),
        ("EXP-900", 3, "fac-c", 18, today - timedelta(days=9), 85),
    ]

    for batch_num, med_idx, fac_code, qty, exp_date, cost in batches_data:
        med = med_objects[med_idx]
        fac = fac_map[fac_code]
        batch = Batch(
            batch_number=batch_num, medicine_id=med.id, facility_id=fac.id,
            quantity=qty, manufacturing_date=exp_date - timedelta(days=365),
            expiry_date=exp_date, unit_cost=cost,
        )
        db.add(batch)

    # --- Alerts ---
    alert_insulin = Alert(
        medicine_id=med_objects[0].id, facility_id=fac_map["fac-main"].id,
        type=AlertType.STOCKOUT, severity=AlertSeverity.CRITICAL,
        title="Critical Stockout Risk — Insulin",
        description="Current stock: 120 units. 30-day projected demand: 360 units. Expected stockout: 11 days.",
        expected_impact="Inability to sustain diabetic inpatient and emergency treatments within 11 days.",
        recommended_action="Order 300 units immediately via MediSupply Pakistan (Lead time: 7 days).",
        status=AlertStatus.OPEN, days_remaining=11, assigned_to="Zubair Ahmed", recommendation_id=1,
    )
    alert_amox = Alert(
        medicine_id=med_objects[1].id, facility_id=fac_map["fac-a"].id,
        type=AlertType.EXPIRY, severity=AlertSeverity.HIGH,
        title="Expiry Risk — Batch AMX-204",
        description="Batch AMX-204: 300 units expire in 45 days. Facility A consumption pace will leave ~111 units to expire.",
        expected_impact="Potential wastage of Rs. 68,820 in high-demand antibiotics.",
        recommended_action="Approve inter-facility stock transfer of 100 units to Facility B.",
        status=AlertStatus.OPEN, days_remaining=45, assigned_to="Asad Khan", recommendation_id=2,
    )
    alert_cef = Alert(
        medicine_id=med_objects[2].id, facility_id=fac_map["fac-main"].id,
        type=AlertType.ANOMALY, severity=AlertSeverity.HIGH,
        title="Unusual Consumption Spike — Ceftriaxone",
        description="Consumption increased 67% over the 4-week moving average.",
        expected_impact="Accelerated inventory depletion reducing buffer from 28 to 13 days.",
        recommended_action="Audit surgical wing requisitions and queue advance order of 400 units.",
        status=AlertStatus.OPEN, days_remaining=13, assigned_to="Dr. Tariq Mahmood", recommendation_id=3,
    )
    alert_salb = Alert(
        medicine_id=med_objects[7].id, facility_id=fac_map["fac-a"].id,
        type=AlertType.LOW_STOCK, severity=AlertSeverity.CRITICAL,
        title="Low Safety Stock Alert — Salbutamol",
        description="Only 45 canisters remain (7 days). Supplier delivery takes 5 days.",
        expected_impact="Imminent zero-inventory risk for acute respiratory ER admissions.",
        recommended_action="Expedite emergency replenishment order of 150 canisters.",
        status=AlertStatus.OPEN, days_remaining=7, assigned_to="Asad Khan",
    )
    db.add_all([alert_insulin, alert_amox, alert_cef, alert_salb])
    db.flush()

    # --- Recommendations ---
    factors_insulin = json.dumps([
        {"name": "Historical consumption", "percentage": 94, "description": "Aggregated 12-month inpatient telemetry"},
        {"name": "Current inventory deficit", "percentage": 88, "description": "Stockout projected in 11 days without replenishment"},
        {"name": "Supplier lead time buffer", "percentage": 76, "description": "MediSupply Pakistan 7-day standard delivery"},
        {"name": "Recent demand trend spike", "percentage": 84, "description": "+33% growth in endocrine patient admissions"},
    ])
    factors_amox = json.dumps([
        {"name": "Expiry timeline proximity", "percentage": 92, "description": "Batch AMX-204 reaches cutoff in 45 days"},
        {"name": "Facility B stockout urgency", "percentage": 86, "description": "Only 14 days operational supply remaining"},
        {"name": "Inter-facility logistics cost", "percentage": 80, "description": "Saves Rs. 62,000 procurement expenditure"},
        {"name": "Balanced post-transfer ratio", "percentage": 89, "description": "Leaves 380 boxes at Facility A"},
    ])
    factors_cef = json.dumps([
        {"name": "Consumption anomaly surge", "percentage": 91, "description": "67% increase in surgical bed utilization"},
        {"name": "Supplier lead time", "percentage": 78, "description": "Indus Healthcare Logistics 5-day SLA"},
        {"name": "Safety threshold coverage", "percentage": 82, "description": "Provides 24-day stable buffer"},
    ])
    factors_salb = json.dumps([
        {"name": "Critical stockout threshold", "percentage": 96, "description": "Below safety buffer of 50 units"},
        {"name": "Emergency room demand", "percentage": 88, "description": "Consistent seasonal asthma admissions"},
    ])

    recs = [
        Recommendation(
            medicine_id=med_objects[0].id, facility_id=fac_map["fac-main"].id,
            type=RecommendationType.PURCHASE, quantity=300,
            recommended_date="Today (Immediate)", reason="Projected 30-day demand (360 units) exceeds available inventory (120 units).",
            confidence=91, estimated_cost=285000, status=RecommendationStatus.PENDING, factors_json=factors_insulin,
        ),
        Recommendation(
            medicine_id=med_objects[1].id, facility_id=fac_map["fac-a"].id,
            type=RecommendationType.TRANSFER, quantity=100,
            source_facility_id=fac_map["fac-a"].id, destination_facility_id=fac_map["fac-b"].id,
            recommended_date="Within 48 Hours",
            reason="Excess inventory at Facility A with upcoming expiry (Batch AMX-204, 45 days) balances urgent stock depletion at Facility B.",
            confidence=87, estimated_cost=62000, estimated_savings=62000, status=RecommendationStatus.PENDING, factors_json=factors_amox,
        ),
        Recommendation(
            medicine_id=med_objects[2].id, facility_id=fac_map["fac-main"].id,
            type=RecommendationType.PURCHASE, quantity=400,
            recommended_date="This Week", reason="Consumption increased 67% over 4-week average. Reorder required for ICU reserve.",
            confidence=85, estimated_cost=168000, status=RecommendationStatus.PENDING, factors_json=factors_cef,
        ),
        Recommendation(
            medicine_id=med_objects[7].id, facility_id=fac_map["fac-a"].id,
            type=RecommendationType.PURCHASE, quantity=150,
            recommended_date="Today", reason="Emergency replenishment for Facility A respiratory ward; 7 days supply remaining.",
            confidence=93, estimated_cost=72000, status=RecommendationStatus.APPROVED,
            factors_json=factors_salb, approved_by=users[1].id, approved_at=datetime.now(timezone.utc),
        ),
    ]
    db.add_all(recs)

    # --- Notifications ---
    notifs = [
        Notification(severity="CRITICAL", title="Insulin stockout risk detected",
                     message="Current stock of 120 units leaves only 11 days remaining.", link="/inventory/med-insulin"),
        Notification(severity="WARNING", title="Amoxicillin batch expiry risk",
                     message="Batch AMX-204 (300 units) expires in 45 days.", link="/recommendations"),
        Notification(severity="WARNING", title="Ceftriaxone consumption anomaly",
                     message="67% increase observed over 4-week average.", link="/inventory/med-ceftriaxone"),
        Notification(severity="SUCCESS", title="Recommendation approved",
                     message="Purchase order for 150 Salbutamol canisters confirmed.", link="/recommendations", read=True),
    ]
    db.add_all(notifs)

    db.commit()
    db.close()
    print("Database seeded successfully!")
    print(f"Demo password for all users: {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed()
