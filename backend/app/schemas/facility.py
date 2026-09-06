"""Facility and supplier schemas matching frontend types."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class FacilityResponse(BaseModel):
    """Matches frontend Facility interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    name: str
    type: str
    location: str
    total_medicines: int = 0
    critical_stockouts: int = 0
    expiry_risks: int = 0
    inventory_value_pkr: float = 0.0
    contact_person: str = ""
    phone: str = ""
    capacity_utilization: int = 0


class SupplierResponse(BaseModel):
    """Matches frontend Supplier interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    name: str
    contact_email: str = ""
    phone: str = ""
    city: str = ""
    medicines_supplied: int = 0
    average_lead_time_days: int = 7
    reliability_score: float = 0.0
    open_orders: int = 0
    last_delivery: str = ""
    quality_rating: float = 0.0
    status: str = "Active"


class BatchResponse(BaseModel):
    """Matches frontend Batch interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    batch_id: str
    medicine_id: str
    medicine_name: str
    facility_id: str
    facility_name: str
    quantity: int
    unit: str
    mfg_date: str
    expiry_date: str
    days_to_expiry: int
    consumption_rate: float
    expiry_risk: str
    status: str
    recommended_action: str = ""
