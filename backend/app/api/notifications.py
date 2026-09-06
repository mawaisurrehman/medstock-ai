"""Notifications API routes."""
from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.assistant import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def _time_ago(dt):
    if not dt:
        return ""
    now = datetime.now(timezone.utc)
    dt_aware = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
    delta = now - dt_aware
    mins = int(delta.total_seconds() / 60)
    if mins < 1:
        return "Just now"
    if mins < 60:
        return f"{mins} min ago"
    hours = mins // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    return f"{delta.days} day{'s' if delta.days > 1 else ''} ago"


@router.get("", response_model=list[NotificationResponse])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(50).all()
    return [NotificationResponse(id=str(n.id), severity=n.severity, title=n.title, message=n.message,
        time_ago=_time_ago(n.created_at), read=n.read, link=n.link or None) for n in notifs]


@router.patch("/{notif_id}/read")
def mark_read(notif_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == int(notif_id)).first()
    if not n:
        raise HTTPException(status_code=404, detail="Not found")
    n.read = True
    db.commit()
    return {"success": True}


@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.read == False).update({"read": True})
    db.commit()
    return {"success": True}
