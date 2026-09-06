"""Inventory service - builds enriched medicine responses from DB data."""
from __future__ import annotations

from datetime import date
from sqlalchemy.orm import Session

from app.models.medicine import Medicine
from app.models.inventory import Inventory
from app.models.batch import Batch
from app.models.consumption import Consumption
from app.models.facility import Facility
from app.schemas.medicine import MedicineResponse, StockMovement
from app.utils.calculations import calculate_days_until_stockout, classify_stockout_risk, classify_expiry_risk


def build_medicine_response(db: Session, med: Medicine) -> MedicineResponse:
    """Build a complete MedicineResponse from DB data, computing derived fields."""
    # Get first inventory entry for this medicine
    inv = db.query(Inventory).filter(Inventory.medicine_id == med.id).first()
    fac = None
    facility_code = ""
    facility_name = ""

    if inv:
        fac = db.query(Facility).filter(Facility.id == inv.facility_id).first()
        if fac:
            facility_code = fac.code
            facility_name = fac.name
        current_stock = inv.current_quantity
        avg_consumption = inv.average_daily_consumption
    else:
        current_stock = 0
        avg_consumption = 0.0

    # Get category name
    category_name = ""
    if med.category:
        category_name = med.category.name

    # Calculate days remaining
    days_remaining = calculate_days_until_stockout(current_stock, avg_consumption)

    # Calculate stockout risk
    stockout_risk = classify_stockout_risk(
        days_remaining,
        med.supplier_lead_time_days,
        med.safety_stock,
        current_stock,
    )

    # Check expiry risk from batches
    batches = db.query(Batch).filter(Batch.medicine_id == med.id).all()
    worst_expiry_risk = "LOW"
    for b in batches:
        risk = classify_expiry_risk(b.days_to_expiry)
        if risk in ("CRITICAL", "HIGH") and worst_expiry_risk not in ("CRITICAL",):
            worst_expiry_risk = risk
        elif risk == "MEDIUM" and worst_expiry_risk == "LOW":
            worst_expiry_risk = risk

    # Determine status
    if stockout_risk in ("CRITICAL",):
        status = "Critical"
    elif stockout_risk == "HIGH" or worst_expiry_risk in ("CRITICAL", "HIGH"):
        status = "Warning"
    elif current_stock > med.safety_stock * 3:
        status = "Overstocked"
    else:
        status = "Healthy"

    # Demand trend from consumption history
    demand_trend = "STABLE"
    recent = (
        db.query(Consumption)
        .filter(Consumption.medicine_id == med.id)
        .order_by(Consumption.date.desc())
        .limit(30)
        .all()
    )
    if len(recent) >= 14:
        first_half = sum(c.issued_quantity for c in recent[14:])
        second_half = sum(c.issued_quantity for c in recent[:14])
        if second_half > first_half * 1.2:
            demand_trend = "INCREASING"
        elif second_half < first_half * 0.8:
            demand_trend = "DECREASING"

    # Stock movement from last month's consumption
    last_month = (
        db.query(Consumption)
        .filter(Consumption.medicine_id == med.id)
        .order_by(Consumption.date.desc())
        .limit(30)
        .all()
    )
    if last_month:
        opening = last_month[-1].opening_stock
        received = sum(c.received_quantity for c in last_month)
        issued = sum(c.issued_quantity for c in last_month)
        closing = last_month[0].closing_stock
    else:
        opening = current_stock
        received = 0
        issued = 0
        closing = current_stock

    # AI risk reasons
    risk_reasons = []
    if stockout_risk in ("CRITICAL", "HIGH"):
        risk_reasons.append(
            f"Current stock ({current_stock} units) is below the 30-day projected demand ({int(avg_consumption * 30)} units)."
        )
        risk_reasons.append(
            f"Supplier lead time is {med.supplier_lead_time_days} days, leaving limited safety margin."
        )
    if worst_expiry_risk in ("CRITICAL", "HIGH"):
        for b in batches:
            if b.days_to_expiry <= 60:
                risk_reasons.append(
                    f"Batch {b.batch_number} ({b.quantity} units) expires in {b.days_to_expiry} days."
                )
    if not risk_reasons:
        risk_reasons.append("Inventory levels are within normal operating parameters.")

    return MedicineResponse(
        id=f"med-{med.id}",
        name=med.name,
        generic_name=med.generic_name,
        category=category_name,
        facility_id=facility_code,
        facility_name=facility_name,
        current_stock=current_stock,
        unit=med.unit,
        daily_consumption=round(avg_consumption, 1),
        days_remaining=days_remaining,
        safety_stock=med.safety_stock,
        reorder_point=med.minimum_stock or med.safety_stock * 2,
        unit_price_pkr=med.unit_price,
        stockout_risk=stockout_risk,
        expiry_risk=worst_expiry_risk,
        demand_trend=demand_trend,
        supplier_lead_time_days=med.supplier_lead_time_days,
        status=status,
        description=med.description,
        stock_movement=StockMovement(
            opening=opening,
            received=received,
            issued=issued,
            closing=closing,
            period="August 2026",
        ),
        ai_risk_reasons=risk_reasons,
    )
