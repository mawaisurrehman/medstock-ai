"""Recommendation schemas matching frontend Recommendation interface."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class RecommendationFactor(BaseModel):
    """Matches frontend RecommendationFactor interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    name: str
    percentage: int
    description: str


class RecommendationResponse(BaseModel):
    """Matches frontend Recommendation interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    code: str
    type: str  # ORDER | TRANSFER | DISCOUNT | EXPEDITE
    medicine_id: str
    medicine_name: str
    category: str
    action_text: str
    quantity: int
    unit: str
    from_facility: str | None = None
    to_facility: str | None = None
    recommended_date: str
    created_at: str | None = None
    expected_stockout_days: int
    estimated_cost_pkr: float
    reason: str
    ai_confidence: int
    status: str  # PENDING | APPROVED | REJECTED | COMPLETED
    factors: list[RecommendationFactor] = []
    created_date: str
    approved_by: str | None = None
    approved_at: str | None = None


class RejectRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    reason: str = ""


class ModifyRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    new_quantity: int
