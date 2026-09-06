"""Alerts API routes."""
from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.alert import Alert, AlertType, AlertStatus, AlertSeverity
from app.models.medicine import Medicine
from app.models.facility import Facility
from app.schemas.alert import AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


def _build(db: Session, a: Alert) -> AlertResponse:
    med = db.query(Medicine).filter(Medicine.id == a.medicine_id).first()
    fac = db.query(Facility).filter(Facility.id == a.facility_id).first()
    severity_map = {"CRITICAL": "CRITICAL", "HIGH": "WARNING", "MEDIUM": "WARNING", "LOW": "INFO"}
    sev = severity_map.get(a.severity.value, "INFO") if hasattr(a.severity, 'value') else a.severity.value

    status_map = {"OPEN": "ACTIVE", "REVIEWED": "REVIEWED", "RESOLVED": "RESOLVED", "SNOOZED": "SNOOZED"}
    st = status_map.get(a.status.value, "ACTIVE") if hasattr(a.status, 'value') else a.status.value

    return AlertResponse(
        id=f"alt-{a.id}",
        type=a.type.value if hasattr(a.type, 'value') else a.type,
        severity=sev,
        medicine_id=f"med-{a.medicine_id}",
        medicine_name=med.name if med else "",
        facility_id=fac.code if fac else "",
        facility_name=fac.name if fac else "",
        detected_at=a.created_at.strftime("%d %b %Y, %I:%M %p") if a.created_at else "",
        title=a.title,
        description=a.description,
        expected_impact=a.expected_impact,
        recommended_action=a.recommended_action,
        status=st,
        days_remaining=a.days_remaining,
        assigned_to=a.assigned_to,
        recommendation_id=f"rec-{a.recommendation_id}" if a.recommendation_id else None,
    )


@router.get("", response_model=list[AlertResponse])
def list_alerts(
    severity: str = Query(""),
    type: str = Query(""),
    facility: str = Query(""),
    status: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alert)
    if severity:
        try:
            query = query.filter(Alert.severity == AlertSeverity(severity))
        except ValueError:
            pass
    if type:
        try:
            query = query.filter(Alert.type == AlertType(type))
        except ValueError:
            pass
    if status:
        try:
            query = query.filter(Alert.status == AlertStatus(status))
        except ValueError:
            pass
    alerts = query.order_by(Alert.created_at.desc()).all()
    result = [_build(db, a) for a in alerts]
    if facility:
        result = [a for a in result if a.facility_id == facility]
    return result


@router.get("/stockout", response_model=list[AlertResponse])
def stockout_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).filter(Alert.type == AlertType.STOCKOUT).order_by(Alert.created_at.desc()).all()
    return [_build(db, a) for a in alerts]


@router.get("/expiry", response_model=list[AlertResponse])
def expiry_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).filter(Alert.type == AlertType.EXPIRY).order_by(Alert.created_at.desc()).all()
    return [_build(db, a) for a in alerts]


@router.get("/anomaly", response_model=list[AlertResponse])
def anomaly_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).filter(Alert.type == AlertType.ANOMALY).order_by(Alert.created_at.desc()).all()
    return [_build(db, a) for a in alerts]


@router.patch("/{alert_id}/review", response_model=AlertResponse)
def review_alert(alert_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    aid = int(alert_id.replace("alt-", ""))
    alert = db.query(Alert).filter(Alert.id == aid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.REVIEWED
    alert.reviewed_at = datetime.now(timezone.utc)
    alert.reviewed_by = current_user.id
    db.commit()
    return _build(db, alert)


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(alert_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    aid = int(alert_id.replace("alt-", ""))
    alert = db.query(Alert).filter(Alert.id == aid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.RESOLVED
    alert.reviewed_at = datetime.now(timezone.utc)
    alert.reviewed_by = current_user.id
    db.commit()
    return _build(db, alert)


@router.patch("/{alert_id}/snooze", response_model=AlertResponse)
def snooze_alert(alert_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    aid = int(alert_id.replace("alt-", ""))
    alert = db.query(Alert).filter(Alert.id == aid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.SNOOZED
    db.commit()
    return _build(db, alert)
