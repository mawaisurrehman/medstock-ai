from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import Integer, Float, Date, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Consumption(Base):
    __tablename__ = "consumption"
    __table_args__ = (
        CheckConstraint("opening_stock >= 0", name="ck_cons_opening"),
        CheckConstraint("received_quantity >= 0", name="ck_cons_received"),
        CheckConstraint("issued_quantity >= 0", name="ck_cons_issued"),
        CheckConstraint("closing_stock >= 0", name="ck_cons_closing"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"), nullable=False, index=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    opening_stock: Mapped[int] = mapped_column(Integer, default=0)
    received_quantity: Mapped[int] = mapped_column(Integer, default=0)
    issued_quantity: Mapped[int] = mapped_column(Integer, default=0)
    closing_stock: Mapped[int] = mapped_column(Integer, default=0)
    patient_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    medicine = relationship("Medicine", back_populates="consumption_records")
    facility = relationship("Facility", back_populates="consumption_records")

    @property
    def expected_closing(self) -> int:
        return self.opening_stock + self.received_quantity - self.issued_quantity

    @property
    def has_discrepancy(self) -> bool:
        return self.closing_stock != self.expected_closing
