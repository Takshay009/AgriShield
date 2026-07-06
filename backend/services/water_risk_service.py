"""
Water Risk Score Engine — Phase 3F
Stateless calculation engine for multi-factor water stress risk scoring.
Uses pandas / numpy vectorized operations for high-performance risk evaluation
across multi-day weather series and spatial telemetry.
"""
import math
from typing import Optional
import pandas as pd
import numpy as np

# --- Crop Water Requirement Database (mm/day during peak growth) ---
CROP_WATER_NEEDS: dict[str, dict] = {
    "rice":       {"daily_mm": 8.0,  "drought_tolerance": 0.1, "waterlog_tolerance": 0.9},
    "wheat":      {"daily_mm": 4.5,  "drought_tolerance": 0.5, "waterlog_tolerance": 0.3},
    "maize":      {"daily_mm": 5.5,  "drought_tolerance": 0.4, "waterlog_tolerance": 0.2},
    "cotton":     {"daily_mm": 5.0,  "drought_tolerance": 0.6, "waterlog_tolerance": 0.2},
    "soybean":    {"daily_mm": 5.0,  "drought_tolerance": 0.5, "waterlog_tolerance": 0.3},
    "sugarcane":  {"daily_mm": 9.0,  "drought_tolerance": 0.2, "waterlog_tolerance": 0.7},
    "groundnut":  {"daily_mm": 4.0,  "drought_tolerance": 0.6, "waterlog_tolerance": 0.2},
    "chickpea":   {"daily_mm": 3.0,  "drought_tolerance": 0.7, "waterlog_tolerance": 0.1},
    "pigeon_pea": {"daily_mm": 3.5,  "drought_tolerance": 0.7, "waterlog_tolerance": 0.2},
    "millet":     {"daily_mm": 3.0,  "drought_tolerance": 0.9, "waterlog_tolerance": 0.2},
    "sorghum":    {"daily_mm": 4.0,  "drought_tolerance": 0.8, "waterlog_tolerance": 0.2},
    "mustard":    {"daily_mm": 3.5,  "drought_tolerance": 0.5, "waterlog_tolerance": 0.2},
    "tomato":     {"daily_mm": 5.5,  "drought_tolerance": 0.3, "waterlog_tolerance": 0.2},
    "onion":      {"daily_mm": 4.0,  "drought_tolerance": 0.3, "waterlog_tolerance": 0.1},
    "potato":     {"daily_mm": 5.0,  "drought_tolerance": 0.3, "waterlog_tolerance": 0.2},
}

DEFAULT_CROP = {"daily_mm": 5.0, "drought_tolerance": 0.5, "waterlog_tolerance": 0.3}


def compute_water_risk_vectorized(
    crop_type: str,
    rainfall_series_mm: list[float],
    temp_series_c: list[float],
    humidity_series_pct: list[float],
    groundwater_depth_m: float = 10.0,
    soil_moisture_pct: Optional[float] = None,
    ndvi: Optional[float] = None,
) -> dict:
    """
    Compute water risk using pandas/numpy vectorized calculations over time series data.
    Fast evaluation suitable for Gov APIs & large spatial datasets.
    """
    crop = CROP_WATER_NEEDS.get(crop_type.lower().replace(" ", "_"), DEFAULT_CROP)
    daily_need = crop["daily_mm"]
    drought_tol = crop["drought_tolerance"]
    waterlog_tol = crop["waterlog_tolerance"]

    # Convert to pandas Series / numpy arrays for fast vectorized math
    s_rain = pd.Series(rainfall_series_mm, dtype=np.float64)
    s_temp = pd.Series(temp_series_c, dtype=np.float64)
    s_hum = pd.Series(humidity_series_pct, dtype=np.float64)

    days_count = len(s_rain)
    if days_count == 0:
        s_rain = pd.Series([0.0] * 7, dtype=np.float64)
        s_temp = pd.Series([28.0] * 7, dtype=np.float64)
        s_hum = pd.Series([50.0] * 7, dtype=np.float64)
        days_count = 7

    factors = {}
    weights = {}

    # 1. Vectorized Rainfall Deficit (30% weight)
    total_rain = float(s_rain.sum())
    expected_rain = daily_need * days_count
    deficit_ratio = max(0.0, 1.0 - (total_rain / max(0.1, expected_rain)))
    rain_risk = min(1.0, deficit_ratio * (1.0 - drought_tol * 0.5))
    
    factors["rainfall_deficit"] = {
        "score": round(rain_risk * 100, 1),
        "detail": f"{days_count}d rain: {total_rain:.1f}mm vs need: {expected_rain:.1f}mm (deficit ratio: {deficit_ratio:.2f})"
    }
    weights["rainfall_deficit"] = 0.30

    # 2. Vectorized Evapotranspiration (ET0 proxy via Hargreaves formula) (15% weight)
    # et0_series = 0.0023 * (T + 17.8) * sqrt(T) * 0.5
    t_clamped = np.maximum(0.0, s_temp)
    et0_series = 0.0023 * (s_temp + 17.8) * np.sqrt(t_clamped) * 0.5
    # Low humidity penalty vectorized: where humidity < 30%, multiply ET0 by 1.3
    low_hum_mask = s_hum < 30.0
    et0_series = np.where(low_hum_mask, et0_series * 1.3, et0_series)
    
    et0_avg = float(et0_series.mean())
    et_stress = min(1.0, max(0.0, (et0_avg - daily_need * 0.5) / max(0.1, daily_need)))
    
    factors["evapotranspiration"] = {
        "score": round(et_stress * 100, 1),
        "detail": f"Vectorized mean ET0: {et0_avg:.2f}mm/day across {days_count} days"
    }
    weights["evapotranspiration"] = 0.15

    # 3. Groundwater Depth Risk (15% weight)
    if groundwater_depth_m <= 5:
        gw_risk = 0.0
    elif groundwater_depth_m <= 10:
        gw_risk = (groundwater_depth_m - 5) / 10.0
    elif groundwater_depth_m <= 20:
        gw_risk = 0.5 + (groundwater_depth_m - 10) / 20.0
    else:
        gw_risk = 1.0
        
    factors["groundwater_depth"] = {
        "score": round(gw_risk * 100, 1),
        "detail": f"Groundwater depth: {groundwater_depth_m:.1f}m"
    }
    weights["groundwater_depth"] = 0.15

    # 4. Soil Moisture Proxy (15% weight)
    if soil_moisture_pct is not None:
        sm = float(soil_moisture_pct)
    else:
        # Estimate from recent rainfall sum + humidity mean
        sm = min(100.0, total_rain * 2.0 + float(s_hum.mean()) * 0.3)
        
    if sm < 20:
        sm_risk = 1.0
    elif sm < 40:
        sm_risk = 0.7
    elif sm < 60:
        sm_risk = 0.3
    elif sm <= 80:
        sm_risk = 0.0
    else:
        sm_risk = min(1.0, (sm - 80) / 20.0 * (1.0 - waterlog_tol))

    factors["soil_moisture"] = {
        "score": round(sm_risk * 100, 1),
        "detail": f"Estimated/Actual soil moisture: {sm:.1f}%"
    }
    weights["soil_moisture"] = 0.15

    # 5. Vectorized Consecutive Dry Days (<2mm rain) (15% weight)
    dry_mask = s_rain < 2.0
    # Calculate max consecutive True values in dry_mask series
    dry_mask_int = dry_mask.astype(int)
    # Group consecutive identical values
    groups = (dry_mask_int != dry_mask_int.shift()).cumsum()
    dry_counts = dry_mask_int.groupby(groups).cumsum()
    max_dry_days = int(dry_counts.max()) if len(dry_counts) > 0 else 0

    if max_dry_days <= 2:
        dry_risk = 0.0
    elif max_dry_days <= 5:
        dry_risk = (max_dry_days - 2) / 6.0
    elif max_dry_days <= 10:
        dry_risk = 0.5 + (max_dry_days - 5) / 10.0
    else:
        dry_risk = 1.0
    dry_risk *= (1.0 - drought_tol * 0.4)

    factors["consecutive_dry_days"] = {
        "score": round(dry_risk * 100, 1),
        "detail": f"Vectorized max consecutive dry days: {max_dry_days} (<2mm/day)"
    }
    weights["consecutive_dry_days"] = 0.15

    # 6. Forecast Trend (10% weight)
    # Using last 3 days of series as proxy for forecast if length >= 3
    if days_count >= 3:
        recent_3d_rain = float(s_rain.tail(3).sum())
    else:
        recent_3d_rain = total_rain
        
    expected_3d = daily_need * 3.0
    forecast_deficit = max(0.0, 1.0 - (recent_3d_rain / max(0.1, expected_3d)))
    forecast_risk = min(1.0, forecast_deficit * 0.8)
    
    factors["forecast_trend"] = {
        "score": round(forecast_risk * 100, 1),
        "detail": f"3-day window rain: {recent_3d_rain:.1f}mm vs target: {expected_3d:.1f}mm"
    }
    weights["forecast_trend"] = 0.10

    # Composite score
    risk_score = sum(
        (factors[k]["score"] / 100.0) * weights[k] * 100.0
        for k in factors
    )
    risk_score = round(min(100.0, max(0.0, risk_score)), 1)

    # NDVI adjustment
    ndvi_penalty = 0.0
    if ndvi is not None and ndvi < 0.35:
        ndvi_penalty = (0.35 - ndvi) * 30.0
        risk_score = round(min(100.0, risk_score + ndvi_penalty), 1)

    # Risk level classification
    if risk_score >= 75:
        risk_level = "critical"
    elif risk_score >= 50:
        risk_level = "high"
    elif risk_score >= 25:
        risk_level = "medium"
    else:
        risk_level = "low"

    recs = _generate_recs(factors, risk_level, crop_type, crop)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "crop_type": crop_type,
        "crop_daily_water_need_mm": daily_need,
        "ndvi_penalty": round(ndvi_penalty, 1),
        "factors": factors,
        "weights": {k: round(v, 2) for k, v in weights.items()},
        "recommendations": recs,
    }


def _generate_recs(factors: dict, risk_level: str, crop_type: str, crop: dict) -> list[str]:
    recs = []
    if factors["rainfall_deficit"]["score"] > 60:
        recs.append(f"🚨 Severe rainfall deficit for {crop_type}. Immediate irrigation required ({crop['daily_mm']}mm/day).")
    elif factors["rainfall_deficit"]["score"] > 30:
        recs.append(f"⚠️ Moderate rainfall deficit. Plan supplemental irrigation within 48h.")

    if factors["evapotranspiration"]["score"] > 50:
        recs.append("🌡️ High evapotranspiration stress. Irrigate during early morning or late evening to minimize loss.")

    if factors["groundwater_depth"]["score"] > 60:
        recs.append("💧 Deep groundwater table detected. Prioritize micro-sprinkler or drip irrigation.")

    if factors["consecutive_dry_days"]["score"] > 50:
        recs.append("☀️ Extended dry spell observed. Contact RSK Kendra for localized soil conservation advisory.")

    if risk_level == "critical":
        recs.append("🔴 CRITICAL WATER STRESS: Eligible for ZKP drought insurance trigger. Capture timestamped farm photos.")
    elif risk_level == "high":
        recs.append("🟠 HIGH WATER STRESS: Monitor daily soil moisture and prepare backup water supply.")

    if not recs:
        recs.append("✅ Water stress levels normal. Maintain regular irrigation schedule.")

    return recs
