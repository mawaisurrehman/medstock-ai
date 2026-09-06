"""Inventory API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.inventory import Inventory
from app.models.medicine import Medicine
from app.models.facility import Facility
from app.models.consumption import Consumption
from app.schemas.medicine import InventoryResponse, ConsumptionHistory

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.get("", response_model=list[InventoryResponse])
def list_inventory(
    facility: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Inventory)
    if facility:
        fac = db.query(Facility).filter(Facility.code == facility).first()
        if fac:
            query = query.filter(Inventory.facility_id == fac.id)
    items = query.all()
    return [
        InventoryResponse(
            id=str(inv.id),
            medicine_id=f"med-{inv.medicine_id}",
            facility_id=f"fac-{inv.facility_id}",
            current_quantity=inv.current_quantity,
            reserved_quantity=inv.reserved_quantity,
            incoming_quantity=inv.incoming_quantity,
            available_stock=inv.available_stock,
            average_daily_consumption=inv.average_daily_consumption,
        )
        for inv in items
    ]


@router.get("/{inv_id}", response_model=InventoryResponse)
def get_inventory(inv_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Inventory).filter(Inventory.id == int(inv_id)).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return InventoryResponse(
        id=str(inv.id),
        medicine_id=f"med-{inv.medicine_id}",
        facility_id=f"fac-{inv.facility_id}",
        current_quantity=inv.current_quantity,
        reserved_quantity=inv.reserved_quantity,
        incoming_quantity=inv.incoming_quantity,
        available_stock=inv.available_stock,
        average_daily_consumption=inv.average_daily_consumption,
    )


@router.get("/{inv_id}/history", response_model=list[ConsumptionHistory])
def get_history(inv_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Inventory).filter(Inventory.id == int(inv_id)).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    records = (
        db.query(Consumption)
        .filter(Consumption.medicine_id == inv.medicine_id, Consumption.facility_id == inv.facility_id)
        .order_by(Consumption.date.desc())
        .limit(90)
        .all()
    )
    return [
        ConsumptionHistory(
            id=str(r.id),
            date=r.date.strftime("%d %b %Y"),
            opening_stock=r.opening_stock,
            received_quantity=r.received_quantity,
            issued_quantity=r.issued_quantity,
            closing_stock=r.closing_stock,
            patient_count=r.patient_count,
        )
        for r in records
    ]


@router.put("/{inv_id}", response_model=InventoryResponse)
def update_inventory(inv_id: str, body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Inventory).filter(Inventory.id == int(inv_id)).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    if "current_quantity" in body:
        inv.current_quantity = body["current_quantity"]
    if "reserved_quantity" in body:
        inv.reserved_quantity = body["reserved_quantity"]
    if "incoming_quantity" in body:
        inv.incoming_quantity = body["incoming_quantity"]
    db.commit()
    db.refresh(inv)
    return InventoryResponse(
        id=str(inv.id),
        medicine_id=f"med-{inv.medicine_id}",
        facility_id=f"fac-{inv.facility_id}",
        current_quantity=inv.current_quantity,
        reserved_quantity=inv.reserved_quantity,
        incoming_quantity=inv.incoming_quantity,
        available_stock=inv.available_stock,
        average_daily_consumption=inv.average_daily_consumption,
    )
