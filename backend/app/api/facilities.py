"""Facilities API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.facility import Facility
from app.models.inventory import Inventory
from app.models.alert import Alert, AlertStatus, AlertType
from app.schemas.facility import FacilityResponse

router = APIRouter(prefix="/api/facilities", tags=["Facilities"])


def _build(db: Session, fac: Facility) -> FacilityResponse:
    total_meds = db.query(func.count(Inventory.id)).filter(Inventory.facility_id == fac.id).scalar() or 0
    alerts = db.query(Alert).filter(Alert.facility_id == fac.id, Alert.status == AlertStatus.OPEN).all()
    crit = sum(1 for a in alerts if a.severity.value == "CRITICAL")
    exp = sum(1 for a in alerts if a.type == AlertType.EXPIRY)
    inv_value = db.query(func.sum(Inventory.current_quantity)).filter(Inventory.facility_id == fac.id).scalar() or 0

    return FacilityResponse(
        id=fac.code,
        name=fac.name,
        type=fac.facility_type,
        location=fac.location,
        total_medicines=total_meds,
        critical_stockouts=crit,
        expiry_risks=exp,
        inventory_value_pkr=float(inv_value) * 500,
        contact_person=fac.contact_person,
        phone=fac.phone,
        capacity_utilization=min(100, int(total_meds / max(1, fac.bed_capacity) * 100)) if fac.bed_capacity else 75,
    )


@router.get("", response_model=list[FacilityResponse])
def list_facilities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    facilities = db.query(Facility).filter(Facility.is_active == True).order_by(Facility.name).all()
    return [_build(db, f) for f in facilities]


@router.get("/{facility_id}", response_model=FacilityResponse)
def get_facility(facility_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fac = db.query(Facility).filter(Facility.code == facility_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")
    return _build(db, fac)
