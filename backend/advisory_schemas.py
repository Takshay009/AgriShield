from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AdvisoryAlertResponse(BaseModel):
    farm_id: int
    alert_type: str
    severity: str
    title: str
    message: str
    start_date: Optional[str] = None
    duration_days: Optional[int] = None
    recommended_action: Optional[str] = None
    created_at: str


class ForecastDayResponse(BaseModel):
    date: str
    temp_max_c: float
    temp_min_c: float
    rainfall_mm: float
    humidity_pct: float


class AdvisoryResponse(BaseModel):
    farm_id: int
    farm_name: Optional[str] = None
    lat: str
    lng: str
    forecast: list[ForecastDayResponse]
    alerts: list[AdvisoryAlertResponse]
    generated_at: str


class SensorDataRequest(BaseModel):
    farm_id: int
    moisture_pct: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    reading_type: Optional[str] = "manual"  # manual | iot
