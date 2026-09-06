"""Recommendations API routes with approval workflow."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.recommendation import Recommendation, RecommendationType, RecommendationStatus
from app.models.medicine import Medicine
from app.models.facility import Facility
from app.models.purchase_order import PurchaseOrder, PurchaseOrderStatus
from app.models.transfer import Transfer, TransferStatus
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.alert import Alert, AlertStatus
from app.schemas.recommendation import RecommendationResponse, RecommendationFactor, RejectRequest, ModifyRequest

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


def _build(db: Session, r: Recommendation) -> RecommendationResponse:
    med = db.query(Medicine).filter(Medicine.id == r.medicine_id).first()
    cat_name = med.category.name if med and med.category else ""

    src_fac = None
    dst_fac = None
    if r.source_facility_id:
        src_fac = db.query(Facility).filter(Facility.id == r.source_facility_id).first()
    if r.destination_facility_id:
        dst_fac = db.query(Facility).filter(Facility.id == r.destination_facility_id).first()

    # Map backend types to frontend types
    type_map = {"PURCHASE": "ORDER", "TRANSFER": "TRANSFER", "MONITOR": "ORDER"}
    rec_type = type_map.get(r.type.value if hasattr(r.type, 'value') else r.type, "ORDER")

    action_map = {"ORDER": "Purchase / Order Medicine", "TRANSFER": "Transfer Stock Between Facilities", "EXPEDITE": "Expedite Purchase"}
    action_text = action_map.get(rec_type, "Recommendation")

    # Parse factors
    factors = []
    try:
        raw = json.loads(r.factors_json) if r.factors_json else []
        for f in raw:
            factors.append(RecommendationFactor(
                name=f.get("name", ""),
                percentage=int(f.get("percentage", 0)),
                description=f.get("description", ""),
            ))
    except (json.JSONDecodeError, TypeError):
        pass

    # Approved by name
    approved_by_name = None
    if r.approved_by:
        u = db.query(User).filter(User.id == r.approved_by).first()
        if u:
            approved_by_name = u.name

    # Frontend type mapping for type field
    frontend_type = rec_type
    if rec_type == "ORDER" and r.quantity > 100:
        frontend_type = "EXPEDITE"

    return RecommendationResponse(
        id=f"rec-{r.id}",
        code=f"#REC-{1000 + r.id}",
        type=rec_type,
        medicine_id=f"med-{r.medicine_id}",
        medicine_name=med.name if med else "",
        category=cat_name,
        action_text=action_text,
        quantity=r.quantity,
        unit=med.unit if med else "units",
        from_facility=src_fac.name if src_fac else None,
        to_facility=dst_fac.name if dst_fac else None,
        recommended_date=r.recommended_date or "Today",
        created_at=r.created_at.strftime("%d %b %Y, %I:%M %p") if r.created_at else None,
        expected_stockout_days=r.days_until_stockout if hasattr(r, 'days_until_stockout') else 0,
        estimated_cost_pkr=r.estimated_cost,
        reason=r.reason,
        ai_confidence=int(r.confidence),
        status=r.status.value if hasattr(r.status, 'value') else r.status,
        factors=factors,
        created_date=r.created_at.strftime("%d %b %Y") if r.created_at else "",
        approved_by=approved_by_name,
        approved_at=r.approved_at.strftime("%d %b %Y, %I:%M %p") if r.approved_at else None,
    )


@router.get("", response_model=list[RecommendationResponse])
def list_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recs = db.query(Recommendation).order_by(Recommendation.created_at.desc()).all()
    return [_build(db, r) for r in recs]


@router.get("/{rec_id}", response_model=RecommendationResponse)
def get_recommendation(rec_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rid = int(rec_id.replace("rec-", ""))
    rec = db.query(Recommendation).filter(Recommendation.id == rid).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return _build(db, rec)


@router.post("/{rec_id}/approve", response_model=RecommendationResponse)
def approve_recommendation(rec_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rid = int(rec_id.replace("rec-", ""))
    rec = db.query(Recommendation).filter(Recommendation.id == rid).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.status != RecommendationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Recommendation is not pending")

    rec.status = RecommendationStatus.APPROVED
    rec.approved_at = datetime.now(timezone.utc)
    rec.approved_by = current_user.id

    # Create purchase order or transfer
    med = db.query(Medicine).filter(Medicine.id == rec.medicine_id).first()
    if rec.type == RecommendationType.PURCHASE:
        po = PurchaseOrder(
            supplier_id=med.default_supplier_id or 1,
            facility_id=rec.facility_id,
            status=PurchaseOrderStatus.APPROVED,
            total_cost=rec.estimated_cost,
            created_by=current_user.id,
            approved_by=current_user.id,
        )
        db.add(po)
    elif rec.type == RecommendationType.TRANSFER:
        tr = Transfer(
            medicine_id=rec.medicine_id,
            source_facility_id=rec.source_facility_id or rec.facility_id,
            destination_facility_id=rec.destination_facility_id or rec.facility_id,
            quantity=rec.quantity,
            status=TransferStatus.APPROVED,
            reason=rec.reason,
            recommended_by_ai=True,
            approved_by=current_user.id,
        )
        db.add(tr)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="RECOMMENDATION_APPROVED",
        entity_type="recommendation",
        entity_id=rec.id,
        new_value=f"Approved: {rec.quantity} units",
    )
    db.add(audit)

    # Notification
    notif = Notification(
        severity="SUCCESS",
        title="Recommendation approved",
        message=f"Purchase order for {rec.quantity} units confirmed.",
        link="/recommendations",
    )
    db.add(notif)

    # Resolve related alerts
    alerts = db.query(Alert).filter(Alert.medicine_id == rec.medicine_id, Alert.status == AlertStatus.OPEN).all()
    for alert in alerts:
        alert.status = AlertStatus.RESOLVED

    db.commit()
    db.refresh(rec)
    return _build(db, rec)


@router.post("/{rec_id}/reject", response_model=RecommendationResponse)
def reject_recommendation(rec_id: str, body: RejectRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rid = int(rec_id.replace("rec-", ""))
    rec = db.query(Recommendation).filter(Recommendation.id == rid).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = RecommendationStatus.REJECTED
    rec.rejected_reason = body.reason

    audit = AuditLog(
        user_id=current_user.id,
        action="RECOMMENDATION_REJECTED",
        entity_type="recommendation",
        entity_id=rec.id,
        new_value=f"Rejected: {body.reason}",
    )
    db.add(audit)
    db.commit()
    db.refresh(rec)
    return _build(db, rec)


@router.post("/{rec_id}/modify", response_model=RecommendationResponse)
def modify_recommendation(rec_id: str, body: ModifyRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rid = int(rec_id.replace("rec-", ""))
    rec = db.query(Recommendation).filter(Recommendation.id == rid).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    old_qty = rec.quantity
    rec.quantity = body.new_quantity
    # Recalculate cost proportionally
    med = db.query(Medicine).filter(Medicine.id == rec.medicine_id).first()
    if med and old_qty > 0:
        unit_price = rec.estimated_cost / old_qty
        rec.estimated_cost = body.new_quantity * unit_price

    db.commit()
    db.refresh(rec)
    return _build(db, rec)
