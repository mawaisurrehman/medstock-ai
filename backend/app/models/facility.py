from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Facility(Base):
    __tablename__ = "facilities"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(300), default="")
    facility_type: Mapped[str] = mapped_column(String(80), default="Main Hospital")
    contact_email: Mapped[str] = mapped_column(String(255), default="")
    contact_person: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")
    bed_capacity: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    inventories = relationship("Inventory", back_populates="facility")
    batches = relationship("Batch", back_populates="facility")
    consumption_records = relationship("Consumption", back_populates="facility")
