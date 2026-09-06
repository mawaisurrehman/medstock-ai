from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    medicines = relationship("Medicine", back_populates="category")


class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    generic_name: Mapped[str] = mapped_column(String(255), default="")
    brand_name: Mapped[str] = mapped_column(String(255), default="")
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    unit: Mapped[str] = mapped_column(String(80), default="units")
    minimum_stock: Mapped[int] = mapped_column(Integer, default=0)
    safety_stock: Mapped[int] = mapped_column(Integer, default=50)
    critical_threshold: Mapped[int] = mapped_column(Integer, default=20)
    default_supplier_id: Mapped[int | None] = mapped_column(
        ForeignKey("suppliers.id"), nullable=True
    )
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    supplier_lead_time_days: Mapped[int] = mapped_column(Integer, default=7)
    description: Mapped[str] = mapped_column(String(1000), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    category = relationship("Category", back_populates="medicines")
    default_supplier = relationship("Supplier", foreign_keys=[default_supplier_id])
    inventories = relationship("Inventory", back_populates="medicine")
    batches = relationship("Batch", back_populates="medicine")
    consumption_records = relationship("Consumption", back_populates="medicine")
    forecasts = relationship("Forecast", back_populates="medicine")
    alerts = relationship("Alert", back_populates="medicine")
    recommendations = relationship("Recommendation", back_populates="medicine")
