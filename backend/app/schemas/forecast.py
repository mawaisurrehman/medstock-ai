"""Forecast schemas matching frontend MedicineForecast."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ForecastPoint(BaseModel):
    """Matches frontend ForecastPoint interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    date: str
    historical: float | None = None
    forecast: float | None = None
    upper_confidence: float | None = None
    lower_confidence: float | None = None


class MedicineForecast(BaseModel):
    """Matches frontend MedicineForecast interface."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, protected_namespaces=())

    medicine_id: str
    medicine_name: str
    facility_id: str
    horizon: str = "30_DAYS"
    forecast7_day: int = 0
    forecast30_day: int = 0
    forecast90_day: int = 0
    points: list[ForecastPoint] = []
    model_name: str = "moving_average"
    accuracy_rate: float = 0.0
    mae: float = 0.0
    mape: float = 0.0
    last_updated: str = ""


class ForecastAccuracy(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    mae: float = 0.0
    mape: float = 0.0
    confidence: float = 0.0
