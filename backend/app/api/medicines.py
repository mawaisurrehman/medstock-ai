"""Medicines API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.medicine import Medicine, Category
from app.models.inventory import Inventory
from app.models.facility import Facility
from app.schemas.medicine import MedicineResponse, MedicineCreate
from app.services.inventory_service import build_medicine_response

router = APIRouter(prefix="/api/medicines", tags=["Medicines"])


def _parse_medicine_id(medicine_id: str) -> int:
    """Accept both raw numeric ids and the ``med-<n>`` form used by the frontend."""
    try:
        return int(str(medicine_id).replace("med-", ""))
    except ValueError:
        raise HTTPException(status_code=404, detail="Medicine not found")


@router.get("", response_model=list[MedicineResponse])
def list_medicines(
    search: str = Query(""),
    category: str = Query(""),
    facility: str = Query(""),
    status: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Medicine).filter(Medicine.is_active == True)
    if search:
        query = query.filter(
            or_(Medicine.name.ilike(f"%{search}%"), Medicine.generic_name.ilike(f"%{search}%"))
        )
    if category:
        cat = db.query(Category).filter(Category.name.ilike(f"%{category}%")).first()
        if cat:
            query = query.filter(Medicine.category_id == cat.id)

    medicines = query.order_by(Medicine.name).all()
    result = [build_medicine_response(db, med) for med in medicines]

    if status:
        result = [m for m in result if m.status == status]
    if facility:
        result = [m for m in result if m.facility_id == facility]
    return result


@router.get("/{medicine_id}", response_model=MedicineResponse)
def get_medicine(medicine_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    med = db.query(Medicine).filter(Medicine.id == _parse_medicine_id(medicine_id)).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return build_medicine_response(db, med)


@router.post("", response_model=MedicineResponse, status_code=201)
def create_medicine(body: MedicineCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = None
    if body.category:
        cat = db.query(Category).filter(Category.name == body.category).first()
        if not cat:
            cat = Category(name=body.category)
            db.add(cat)
            db.flush()

    med = Medicine(
        name=body.name,
        generic_name=body.generic_name,
        category_id=cat.id if cat else None,
        unit=body.unit,
        safety_stock=body.safety_stock,
        unit_price=body.unit_price_pkr,
        supplier_lead_time_days=body.supplier_lead_time_days,
        description=body.description,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return build_medicine_response(db, med)


@router.put("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(medicine_id: str, body: MedicineCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    med = db.query(Medicine).filter(Medicine.id == _parse_medicine_id(medicine_id)).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    med.name = body.name
    med.generic_name = body.generic_name
    med.unit = body.unit
    med.safety_stock = body.safety_stock
    med.unit_price = body.unit_price_pkr
    med.description = body.description
    db.commit()
    db.refresh(med)
    return build_medicine_response(db, med)


@router.delete("/{medicine_id}")
def delete_medicine(medicine_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    med = db.query(Medicine).filter(Medicine.id == _parse_medicine_id(medicine_id)).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    med.is_active = False
    db.commit()
    return {"success": True}
