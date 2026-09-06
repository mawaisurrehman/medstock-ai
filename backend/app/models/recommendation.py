from __future__ import annotations

import enum
from datetime import datetime, date, timezone

from sqlalchemy import String, Integer, Float, DateTime, Date, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecommendationType(str, enum.Enum):
    PURCHASE = "PURCHASE"
    TRANSFER = "TRANSFER"
    MONITOR = "MONITOR"


class RecommendationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"), nullable=False, index=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"), nullable=False, index=True)
    type: Mapped[RecommendationType] = mapped_column(Enum(RecommendationType), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    source_facility_id: Mapped[int | None] = mapped_column(
        ForeignKey("facilities.id"), nullable=True
    )
    destination_facility_id: Mapped[int | None] = mapped_column(
        ForeignKey("facilities.id"), nullable=True
    )
    recommended_date: Mapped[str] = mapped_column(String(100), default="")
    expected_stockout_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    reason: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_savings: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[RecommendationStatus] = mapped_column(
        Enum(RecommendationStatus), default=RecommendationStatus.PENDING, index=True
    )
    factors_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    rejected_reason: Mapped[str] = mapped_column(Text, default="")

    medicine = relationship("Medicine", back_populates="recommendations")
