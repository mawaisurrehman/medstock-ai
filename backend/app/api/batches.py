"""Batches API routes."""
from __future__ import annotations

from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.batch import Batch
from app.models.medicine import Medicine
from app.models.facility import Facility
from app.schemas.facility import BatchResponse
from app.utils.calculations import classify_expiry_risk

router = APIRouter(prefix="/api/batches", tags=["Batches"])


def _build(db: Session, b: Batch) -> BatchResponse:
    med = db.query(Medicine).filter(Medicine.id == b.medicine_id).first()
    fac = db.query(Facility).filter(Facility.id == b.facility_id).first()
    dte = b.days_to_expiry
    risk = classify_expiry_risk(dte)

    if dte < 0:
        status_label = "Expired"
    elif dte <= 30:
        status_label = "0-30 days"
    elif dte <= 60:
        status_label = "31-60 days"
    elif dte <= 90:
        status_label = "61-90 days"
    else:
        status_label = "90+ days"

    # Simple recommended action
    if risk == "CRITICAL" and dte < 0:
        rec = "Quarantine immediately and initiate safe disposal"
    elif risk in ("CRITICAL", "HIGH"):
        rec = f"Transfer to high-demand facility or prioritize FIFO dispensing"
    else:
        rec = "Normal FIFO dispensing"

    return BatchResponse(
        batch_id=b.batch_number,
        medicine_id=f"med-{b.medicine_id}",
        medicine_name=med.name if med else "",
        facility_id=fac.code if fac else "",
        facility_name=fac.name if fac else "",
        quantity=b.quantity,
        unit=med.unit if med else "units",
        mfg_date=b.manufacturing_date.strftime("%d %b %Y"),
        expiry_date=b.expiry_date.strftime("%d %b %Y"),
        days_to_expiry=dte,
        consumption_rate=round(b.quantity / max(1, dte) if dte > 0 else 0, 1),
        expiry_risk=risk,
        status=status_label,
        recommended_action=rec,
    )


@router.get("", response_model=list[BatchResponse])
def list_batches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batches = db.query(Batch).order_by(Batch.expiry_date).all()
    return [_build(db, b) for b in batches]


@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch(batch_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Batch).filter(Batch.batch_number == batch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    return _build(db, b)
