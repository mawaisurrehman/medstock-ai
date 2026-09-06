"""Alert schemas matching frontend Alert interface."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class AlertResponse(BaseModel):
    """Matches frontend Alert interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    type: str
    severity: str
    medicine_id: str
    medicine_name: str
    facility_id: str
    facility_name: str
    detected_at: str
    title: str
    description: str
    expected_impact: str = ""
    recommended_action: str = ""
    status: str = "ACTIVE"
    days_remaining: int | None = None
    assigned_to: str | None = None
    recommendation_id: str | None = None
