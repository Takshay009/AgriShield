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
                    "title": "🔥 Hot & Dry Weather Alert",
                    "message": f"Very hot and no rain expected for {dry_streak} days starting {dry_start}. Your crops will get thirsty and dry out!",
                    "start_date": dry_start,
                    "duration_days": dry_streak,
                    "recommended_action": "👉 Give full water to your fields immediately! Cover the soil around plant roots with dry straw or leaves to stop water from drying up.",
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
            "title": "🔥 Hot & Dry Weather Alert",
            "message": f"Very hot and no rain expected for {dry_streak}+ days starting {dry_start}. This hot weather may continue for long!",
            "start_date": dry_start,
            "duration_days": dry_streak,
            "recommended_action": "👉 Give full water to your fields immediately! Cover the soil around plant roots with dry straw or leaves to stop water from drying up.",
            "created_at": datetime.utcnow().isoformat(),
        })
    
    # --- Flood Risk ---
    for day in forecast:
        if day["rainfall_mm"] > 50:
            alerts.append({
                "farm_id": farm_id,
                "alert_type": "flood_risk",
                "severity": "high" if day["rainfall_mm"] > 100 else "medium",
                "title": "🌊 Heavy Rain & Flood Alert",
                "message": f"Very heavy rain ({day['rainfall_mm']} mm) coming on {day['date']}! Water may collect and drown your crop roots.",
                "start_date": day["date"],
                "duration_days": 1,
                "recommended_action": "👉 Clean and open all water drains in your field right now! Do not spray any chemicals or fertilizer today. Move harvested crops to a dry shed.",
                "created_at": datetime.utcnow().isoformat(),
            })
    
    # --- Frost Alert ---
    for day in forecast:
        if day["temp_min_c"] < 5:
            alerts.append({
                "farm_id": farm_id,
                "alert_type": "frost",
                "severity": "high" if day["temp_min_c"] < 0 else "medium",
                "title": "❄️ Extreme Cold & Frost Warning",
                "message": f"Very cold night ({day['temp_min_c']}°C) coming on {day['date']}! Ice can form on leaves and burn your crops.",
                "start_date": day["date"],
                "duration_days": 1,
                "recommended_action": "👉 Give light water to your field in the evening (wet soil stays warmer at night). Cover young plants with plastic sheets or cloth before sunset.",
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
                    "title": "🌡️ Extreme Heat Wave Warning",
                    "message": f"Dangerous heat (above 42°C) coming for {heat_streak} days starting {heat_start}. Crops will burn without extra care!",
                    "start_date": heat_start,
                    "duration_days": heat_streak,
                    "recommended_action": "👉 Give water to your crops in early morning or evening (never at afternoon noon). Keep farm animals in shade with plenty of drinking water.",
                    "created_at": datetime.utcnow().isoformat(),
                })
            heat_streak = 0
    if heat_streak >= 3:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "heat_wave",
            "severity": "high",
            "title": "🌡️ Extreme Heat Wave Warning",
            "message": f"Dangerous heat (above 42°C) coming for {heat_streak}+ days starting {heat_start}. Crops will burn without extra care!",
            "start_date": heat_start,
            "duration_days": heat_streak,
            "recommended_action": "👉 Give water to your crops in early morning or evening (never at afternoon noon). Keep farm animals in shade with plenty of drinking water.",
            "created_at": datetime.utcnow().isoformat(),
        })
    
    # --- Low Humidity (pest risk) ---
    low_humid_days = [d for d in forecast if d["humidity_pct"] < 20]
    if len(low_humid_days) >= 2:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "low_humidity",
            "severity": "low",
            "title": "🐛 Dry Air — Bug & Pest Warning",
            "message": f"Air will be very dry for {len(low_humid_days)} days starting {low_humid_days[0]['date']}. Red bugs and mites love dry air and may attack leaves!",
            "start_date": low_humid_days[0]["date"],
            "duration_days": len(low_humid_days),
            "recommended_action": "👉 Check the underside of leaves for small bugs or webs. If you see bugs, spray neem oil (10 spoons per bucket of water) in the evening.",
            "created_at": datetime.utcnow().isoformat(),
        })
    
    # --- Fertilization Schedule: Nitrogen / Urea Top-Dressing ---
    mod_rain_days = [d for d in forecast[:4] if 2 <= d["rainfall_mm"] <= 35]
    if len(mod_rain_days) >= 1:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "fertilization",
            "severity": "info",
            "title": "🌱 Best Time to Put Urea / Nitrogen Fertilizer",
            "message": f"Good light rain ({mod_rain_days[0]['rainfall_mm']} mm) expected on {mod_rain_days[0]['date']}! Soil will be damp and perfect for feeding crops so fertilizer won't wash away.",
            "start_date": mod_rain_days[0]["date"],
            "duration_days": 2,
            "recommended_action": "👉 Put 1 bag (approx 45 kg) of Urea per acre near crop roots while soil is damp. Do not throw fertilizer if heavy storms or floods are coming!",
            "created_at": datetime.utcnow().isoformat(),
        })

    # --- Fertilization Schedule: Potassium Drought-Armor Spray ---
    high_temp_days = [d for d in forecast if d["temp_max_c"] > 36]
    if len(high_temp_days) >= 2:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "fertilization",
            "severity": "medium",
            "title": "🛡️ Heat Protection Spray (Potash Fertilizer)",
            "message": f"Very hot weather coming from {high_temp_days[0]['date']}. Spraying Potash on leaves acts like a shield to keep crops green and save water inside plants!",
            "start_date": high_temp_days[0]["date"],
            "duration_days": len(high_temp_days),
            "recommended_action": "👉 Mix 2 spoons (approx 100g) of Potash powder in 1 bucket (10 liters) of water. Spray on crop leaves during cool early morning or evening.",
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
                    "title": "🌱 Best Time to Sow Seeds",
                    "message": f"Perfect weather for planting seeds! {good_days} days of gentle rain and pleasant weather starting {good_start}.",
                    "start_date": good_start,
                    "duration_days": good_days,
                    "recommended_action": "👉 Plough your field and plant your seeds now! Seeds will sprout quickly and healthy in this weather.",
                    "created_at": datetime.utcnow().isoformat(),
                })
            good_days = 0
    if good_days >= 3:
        alerts.append({
            "farm_id": farm_id,
            "alert_type": "sowing_window",
            "severity": "info",
            "title": "🌱 Best Time to Sow Seeds",
            "message": f"Perfect weather for planting seeds! {good_days} days of gentle rain and pleasant weather starting {good_start}.",
            "start_date": good_start,
            "duration_days": good_days,
            "recommended_action": "👉 Plough your field and plant your seeds now! Seeds will sprout quickly and healthy in this weather.",
            "created_at": datetime.utcnow().isoformat(),
        })
    
    # Sort by severity priority
    severity_order = {"high": 0, "medium": 1, "low": 2, "info": 3}
    alerts.sort(key=lambda a: severity_order.get(a["severity"], 4))
    
    return alerts
