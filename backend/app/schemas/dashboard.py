"""Dashboard schemas matching frontend DashboardStats."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class DashboardStats(BaseModel):
    """Matches frontend DashboardStats interface exactly."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    total_medicines: int = 0
    total_medicines_trend: float = 0.0
    critical_stockout_risks: int = 0
    expiry_risks: int = 0
    low_stock_items: int = 0
    forecast_accuracy: float = 0.0
    mape: float = 0.0
    estimated_savings_pkr: str = "Rs. 0"
