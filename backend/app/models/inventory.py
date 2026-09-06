from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Integer, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (
        CheckConstraint("current_quantity >= 0", name="ck_inv_qty"),
        CheckConstraint("reserved_quantity >= 0", name="ck_inv_reserved"),
        CheckConstraint("incoming_quantity >= 0", name="ck_inv_incoming"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"), nullable=False, index=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"), nullable=False, index=True)
    current_quantity: Mapped[int] = mapped_column(Integer, default=0)
    reserved_quantity: Mapped[int] = mapped_column(Integer, default=0)
    incoming_quantity: Mapped[int] = mapped_column(Integer, default=0)
    average_daily_consumption: Mapped[float] = mapped_column(Float, default=0.0)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    medicine = relationship("Medicine", back_populates="inventories")
    facility = relationship("Facility", back_populates="inventories")

    @property
    def available_stock(self) -> int:
        return self.current_quantity - self.reserved_quantity
