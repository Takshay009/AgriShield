"""
Advisory Engine — Rule-based alert generation
Analyzes weather forecast to generate farming advisories and dry-spell alerts.
"""
from typing import Optional
from datetime import datetime


def analyze_forecast(forecast: list[dict], farm_id: int, crop_name: Optional[str] = None) -> list[dict]:
    """
    Analyze a 7-day forecast and generate advisory alerts.
    
    Rules:
    - Dry spell: 3+ consecutive days with rainfall < 2mm AND temp_max > 35°C
    - Flood risk: any day with rainfall > 50mm
    - Frost alert: any day with temp_min < 5°C
    - Heat wave: 3+ consecutive days with temp_max > 42°C
    - Low humidity: humidity < 20% for 2+ days (pest risk)
    - Good sowing window: moderate rain + mild temp for 3+ days
    
    Returns list of alert dicts.
    """
    alerts = []
    
    if not forecast:
        return alerts
    
    # --- Dry Spell Detection ---
    dry_streak = 0
    dry_start = None
    for day in forecast:
        if day["rainfall_mm"] < 2.0 and day["temp_max_c"] > 35:
            if dry_streak == 0:
                dry_start = day["date"]
            dry_streak += 1
        else:
            if dry_streak >= 3:
                alerts.append({
                    "farm_id": farm_id,
                    "alert_type": "dry_spell",
                    "severity": "high" if dry_streak >= 5 else "medium",
                    "title": "🔥 Dry Spell Warning",
                    "message": f"Dry spell detected: {dry_streak} consecutive days with minimal rain and high temperatures starting {dry_start}. Consider irrigation planning.",
                    "start_date": dry_start,
                    "duration_days": dry_streak,
                    "recommended_action": "Activate irrigation systems. Consider mulching to retain soil moisture. Monitor crop stress signs.",
                    "created_at": datetime.utcnow().isoformat(),
                })
            dry_streak = 0
            dry_start = None
    # Check if streak extends to end of forecast
    if dry_streak >= 3:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "dry_spell",
            "severity": "high" if dry_streak >= 5 else "medium",
            "title": "🔥 Dry Spell Warning",
            "message": f"Dry spell detected: {dry_streak}+ consecutive days with minimal rain and high temperatures starting {dry_start}. May extend beyond forecast window.",
            "start_date": dry_start,
            "duration_days": dry_streak,
            "recommended_action": "Activate irrigation systems. Consider mulching to retain soil moisture. Monitor crop stress signs.",
            "created_at": datetime.utcnow().isoformat(),
        })
    
    # --- Flood Risk ---
    for day in forecast:
        if day["rainfall_mm"] > 50:
            alerts.append({
                "farm_id": farm_id,
                "alert_type": "flood_risk",
                "severity": "high" if day["rainfall_mm"] > 100 else "medium",
                "title": "🌊 Heavy Rainfall Alert",
                "message": f"Heavy rainfall of {day['rainfall_mm']}mm expected on {day['date']}. Risk of waterlogging and crop damage.",
                "start_date": day["date"],
                "duration_days": 1,
                "recommended_action": "Ensure drainage channels are clear. Avoid field operations. Protect harvested crops from moisture.",
                "created_at": datetime.utcnow().isoformat(),
            })
    
    # --- Frost Alert ---
    for day in forecast:
        if day["temp_min_c"] < 5:
            alerts.append({
                "farm_id": farm_id,
                "alert_type": "frost",
                "severity": "high" if day["temp_min_c"] < 0 else "medium",
                "title": "❄️ Frost Alert",
                "message": f"Temperature dropping to {day['temp_min_c']}°C on {day['date']}. Frost damage risk for sensitive crops.",
                "start_date": day["date"],
                "duration_days": 1,
                "recommended_action": "Cover sensitive crops with frost cloth. Irrigate before sunset to release heat. Avoid pruning.",
                "created_at": datetime.utcnow().isoformat(),
            })
    
    # --- Heat Wave ---
    heat_streak = 0
    heat_start = None
    for day in forecast:
        if day["temp_max_c"] > 42:
            if heat_streak == 0:
                heat_start = day["date"]
            heat_streak += 1
        else:
            if heat_streak >= 3:
                alerts.append({
                    "farm_id": farm_id,
                    "alert_type": "heat_wave",
                    "severity": "high",
                    "title": "🌡️ Heat Wave Warning",
                    "message": f"Extreme heat: {heat_streak} consecutive days above 42°C starting {heat_start}.",
                    "start_date": heat_start,
                    "duration_days": heat_streak,
                    "recommended_action": "Increase irrigation frequency. Provide shade for livestock. Avoid midday field work.",
                    "created_at": datetime.utcnow().isoformat(),
                })
            heat_streak = 0
    if heat_streak >= 3:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "heat_wave",
            "severity": "high",
            "title": "🌡️ Heat Wave Warning",
            "message": f"Extreme heat: {heat_streak}+ consecutive days above 42°C starting {heat_start}.",
            "start_date": heat_start,
            "duration_days": heat_streak,
            "recommended_action": "Increase irrigation frequency. Provide shade for livestock. Avoid midday field work.",
            "created_at": datetime.utcnow().isoformat(),
        })
    
    # --- Low Humidity (pest risk) ---
    low_humid_days = [d for d in forecast if d["humidity_pct"] < 20]
    if len(low_humid_days) >= 2:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "low_humidity",
            "severity": "low",
            "title": "🐛 Low Humidity — Pest Risk",
            "message": f"Low humidity ({len(low_humid_days)} days below 20%) increases risk of spider mites and other pests.",
            "start_date": low_humid_days[0]["date"],
            "duration_days": len(low_humid_days),
            "recommended_action": "Scout fields for pest activity. Consider preventive spraying if pest pressure builds.",
            "created_at": datetime.utcnow().isoformat(),
        })
    
    # --- Fertilization Schedule: Nitrogen / Urea Top-Dressing ---
    mod_rain_days = [d for d in forecast[:4] if 2 <= d["rainfall_mm"] <= 35]
    if len(mod_rain_days) >= 1:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "fertilization",
            "severity": "info",
            "title": "🧪 Fertilization Window: Nitrogen / Urea Top-Dressing",
            "message": f"Optimal soil moisture forecast on {mod_rain_days[0]['date']} ({mod_rain_days[0]['rainfall_mm']}mm rain). Ideal conditions for top-dressing Nitrogen/Urea fertilizer without nutrient leaching or runoff.",
            "start_date": mod_rain_days[0]["date"],
            "duration_days": 2,
            "recommended_action": "Apply Urea (45 kg/acre) or NPK (20:20:20) into damp soil. Do not apply if heavy storms (>50mm) are predicted.",
            "created_at": datetime.utcnow().isoformat(),
        })

    # --- Fertilization Schedule: Potassium Drought-Armor Spray ---
    high_temp_days = [d for d in forecast if d["temp_max_c"] > 36]
    if len(high_temp_days) >= 2:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "fertilization",
            "severity": "medium",
            "title": "🧪 Fertilization Alert: Potassium Drought-Armor",
            "message": f"High temperatures (>36°C) and evaporation stress predicted starting {high_temp_days[0]['date']}. Potassium foliar spray will boost crop heat tolerance and stomatal water regulation.",
            "start_date": high_temp_days[0]["date"],
            "duration_days": len(high_temp_days),
            "recommended_action": "Spray Potassium Nitrate (13-0-45) or Sulphate of Potash at 10g/liter water during cool morning/evening hours.",
            "created_at": datetime.utcnow().isoformat(),
        })

    # --- Favorable Sowing Window ---
    good_days = 0
    good_start = None
    for day in forecast:
        if 2 <= day["rainfall_mm"] <= 20 and 18 <= day["temp_max_c"] <= 35:
            if good_days == 0:
                good_start = day["date"]
            good_days += 1
        else:
            if good_days >= 3:
                alerts.append({
                    "farm_id": farm_id,
                    "alert_type": "sowing_window",
                    "severity": "info",
                    "title": "🌱 Good Sowing Window",
                    "message": f"Favorable conditions for sowing: {good_days} days of moderate rain and mild temperatures from {good_start}.",
                    "start_date": good_start,
                    "duration_days": good_days,
                    "recommended_action": "Ideal time for sowing. Prepare seedbeds and ensure seed availability.",
                    "created_at": datetime.utcnow().isoformat(),
                })
            good_days = 0
    if good_days >= 3:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "sowing_window",
            "severity": "info",
            "title": "🌱 Good Sowing Window",
            "message": f"Favorable conditions for sowing: {good_days} days of moderate rain and mild temperatures from {good_start}.",
            "start_date": good_start,
            "duration_days": good_days,
            "recommended_action": "Ideal time for sowing. Prepare seedbeds and ensure seed availability.",
            "created_at": datetime.utcnow().isoformat(),
        })
    
    # Sort by severity priority
    severity_order = {"high": 0, "medium": 1, "low": 2, "info": 3}
    alerts.sort(key=lambda a: severity_order.get(a["severity"], 4))
    
    return alerts
