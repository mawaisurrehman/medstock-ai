"""Medicine and inventory schemas matching frontend TypeScript types."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class StockMovement(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    opening: int = 0
    received: int = 0
    issued: int = 0
    closing: int = 0
    period: str = ""


class MedicineResponse(BaseModel):
    """Matches frontend Medicine interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, from_attributes=True)

    id: str
    name: str
    generic_name: str = ""
    category: str = ""
    facility_id: str = ""
    facility_name: str = ""
    current_stock: int = 0
    unit: str = "units"
    daily_consumption: float = 0.0
    days_remaining: int = 0
    safety_stock: int = 0
    reorder_point: int = 0
    unit_price_pkr: float = 0.0
    stockout_risk: str = "LOW"
    expiry_risk: str = "LOW"
    demand_trend: str = "STABLE"
    supplier_lead_time_days: int = 7
    status: str = "Healthy"
    description: str = ""
    stock_movement: StockMovement = StockMovement()
    ai_risk_reasons: list[str] = []


class MedicineCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    name: str
    generic_name: str = ""
    category: str = ""
    facility_id: str = ""
    unit: str = "units"
    safety_stock: int = 50
    unit_price_pkr: float = 0.0
    supplier_lead_time_days: int = 7
    description: str = ""


class InventoryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, from_attributes=True)

    id: str
    medicine_id: str
    facility_id: str
    current_quantity: int
    reserved_quantity: int
    incoming_quantity: int
    available_stock: int
    average_daily_consumption: float


class ConsumptionHistory(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, from_attributes=True)

    id: str
    date: str
    opening_stock: int
    received_quantity: int
    issued_quantity: int
    closing_stock: int
    patient_count: int = 0
