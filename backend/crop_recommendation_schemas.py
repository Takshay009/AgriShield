from pydantic import BaseModel
from typing import Optional


class CropRecommendationRequest(BaseModel):
    lat: str
    lng: str
    soil_type: Optional[str] = None
    ph: Optional[float] = None
    month: Optional[int] = None  # 1-12
    top_n: Optional[int] = 5
    groundwater_depth_m: Optional[float] = 10.0


class CropScoreBreakdown(BaseModel):
    soil: Optional[float] = None
    ph: Optional[float] = None
    temperature: Optional[float] = None
    water: Optional[float] = None
    season: Optional[float] = None
    state_bonus: Optional[float] = None
    groundwater_penalty: Optional[float] = None


class CropRecommendationItem(BaseModel):
    crop_name: str
    score: float
    suitability_pct: float
    breakdown: CropScoreBreakdown
    sowing_window: str
    harvest_months: list[str]
    water_need_mm: int
    soil_types: list[str]
    ph_range: str
    temp_range: str


class CropRecommendationResponse(BaseModel):
    state_detected: Optional[str] = None
    soil_type_used: Optional[str] = None
    ph_used: Optional[float] = None
    annual_rainfall_mm: Optional[float] = None
    current_temp_c: Optional[float] = None
    groundwater_depth_m_used: Optional[float] = None
    month: str
    recommendations: list[CropRecommendationItem]
