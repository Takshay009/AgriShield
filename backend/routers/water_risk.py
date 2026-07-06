"""
Water Risk Router — Phase 3F
Gov API versioned endpoint: POST /api/v1/water-risk
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.water_risk_service import compute_water_risk_vectorized

router = APIRouter(prefix="/api/v1", tags=["Water Risk Score Engine (Gov API v1)"])


class WaterRiskRequest(BaseModel):
    crop_type: str = Field("rice", description="Target crop type (e.g., rice, wheat, cotton, soybean)")
    rainfall_series_mm: List[float] = Field([0.0, 1.5, 0.0, 0.0, 2.0, 0.0, 0.0], description="Daily rainfall series in mm over recent/forecast window")
    temp_series_c: List[float] = Field([32.0, 33.5, 34.0, 35.0, 33.0, 34.5, 36.0], description="Daily mean temperature series in °C")
    humidity_series_pct: List[float] = Field([45.0, 40.0, 38.0, 35.0, 42.0, 36.0, 30.0], description="Daily mean relative humidity series in %")
    groundwater_depth_m: float = Field(12.0, description="Groundwater table depth in meters")
    soil_moisture_pct: Optional[float] = Field(None, description="Direct soil moisture sensor reading in % (optional)")
    ndvi: Optional[float] = Field(None, description="Satellite NDVI reading 0.0 to 1.0 (optional)")

    class Config:
        json_schema_extra = {
            "example": {
                "crop_type": "cotton",
                "rainfall_series_mm": [0.0, 0.0, 1.2, 0.0, 0.0, 0.0, 0.0],
                "temp_series_c": [34.0, 35.5, 36.0, 37.0, 36.5, 38.0, 39.0],
                "humidity_series_pct": [35.0, 32.0, 30.0, 28.0, 25.0, 26.0, 24.0],
                "groundwater_depth_m": 15.5,
                "soil_moisture_pct": 22.0,
                "ndvi": 0.42
            }
        }


class WaterRiskFactorDetail(BaseModel):
    score: float
    detail: str


class WaterRiskResponse(BaseModel):
    risk_score: float = Field(..., description="Overall water risk score from 0.0 to 100.0")
    risk_level: str = Field(..., description="Risk tier: low, medium, high, critical")
    crop_type: str
    crop_daily_water_need_mm: float
    ndvi_penalty: float
    factors: Dict[str, WaterRiskFactorDetail]
    weights: Dict[str, float]
    recommendations: List[str]


@router.post("/water-risk", response_model=WaterRiskResponse)
def evaluate_water_risk(request: WaterRiskRequest):
    """
    Evaluate multi-factor agricultural water stress risk using vectorized pandas/numpy computations.
    Designed for government agricultural monitoring & ZKP drought trigger validation.
    """
    try:
        result = compute_water_risk_vectorized(
            crop_type=request.crop_type,
            rainfall_series_mm=request.rainfall_series_mm,
            temp_series_c=request.temp_series_c,
            humidity_series_pct=request.humidity_series_pct,
            groundwater_depth_m=request.groundwater_depth_m,
            soil_moisture_pct=request.soil_moisture_pct,
            ndvi=request.ndvi
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Water risk computation failed: {str(e)}")
