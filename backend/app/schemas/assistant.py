"""AI Assistant schemas matching frontend AIMessage."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    message: str
    language: str = "en"


class QuickAction(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    label: str
    action: str


class DataPoint(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    label: str
    value: str


class AIMessage(BaseModel):
    """Matches frontend AIMessage interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    sender: str  # user | assistant
    text: str
    urdu_text: str | None = None
    timestamp: str = ""
    quick_actions: list[QuickAction] | None = None
    confidence: int | None = None
    data_points: list[DataPoint] | None = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    severity: str
    title: str
    message: str
    time_ago: str
    read: bool = False
    link: str | None = None


class ReportTemplateResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    title: str
    description: str
    category: str
    frequency: str
    last_generated: str
    format: str


class UploadResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    success: bool
    records_count: int = 0
    medicines_count: int = 0
    facilities_count: int = 0
    warnings: list[str] = []
    generated_alerts: int = 0
    generated_recommendations: int = 0
