from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    contact_person: Mapped[str] = mapped_column(String(200), default="")
    contact_email: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")
    city: Mapped[str] = mapped_column(String(100), default="")
    average_lead_time_days: Mapped[int] = mapped_column(Integer, default=7)
    minimum_order_quantity: Mapped[int] = mapped_column(Integer, default=1)
    reliability_score: Mapped[float] = mapped_column(Float, default=90.0)
    quality_rating: Mapped[float] = mapped_column(Float, default=4.0)
    status: Mapped[str] = mapped_column(String(50), default="Active")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
