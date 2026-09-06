from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Batch(Base):
    __tablename__ = "batches"
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="ck_batch_qty"),
        CheckConstraint("unit_cost >= 0", name="ck_batch_cost"),
        CheckConstraint("expiry_date >= manufacturing_date", name="ck_batch_dates"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_number: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"), nullable=False, index=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    manufacturing_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    medicine = relationship("Medicine", back_populates="batches")
    facility = relationship("Facility", back_populates="batches")

    @property
    def days_to_expiry(self) -> int:
        return (self.expiry_date - date.today()).days
