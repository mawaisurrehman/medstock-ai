"""Suppliers API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.supplier import Supplier
from app.schemas.facility import SupplierResponse

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


def _build(s: Supplier) -> SupplierResponse:
    return SupplierResponse(
        id=f"sup-{s.id}",
        name=s.name,
        contact_email=s.contact_email,
        phone=s.phone,
        city=s.city,
        medicines_supplied=30,
        average_lead_time_days=s.average_lead_time_days,
        reliability_score=s.reliability_score,
        open_orders=2,
        last_delivery="28 Aug 2026",
        quality_rating=s.quality_rating,
        status=s.status,
    )


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [_build(s) for s in db.query(Supplier).filter(Supplier.is_active == True).order_by(Supplier.name).all()]


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sid = int(supplier_id.replace("sup-", ""))
    sup = db.query(Supplier).filter(Supplier.id == sid).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return _build(sup)
