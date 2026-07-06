"""
Weather Service with Forecast Mode
Extends existing weather fetching to include 7-day forecast for advisory engine.
"""
import urllib.request
import json
import hashlib
from typing import Optional


def fetch_weather_current(lat: float, lng: float) -> dict:
    """Fetch current weather from Open-Meteo API."""
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,precipitation"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'CropGuard/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            current = data.get("current", {})
            return {
                "temp_c": current.get("temperature_2m", 25.0),
                "humidity": current.get("relative_humidity_2m", 50.0),
                "rainfall_mm": current.get("precipitation", 0.0)
            }
    except Exception as e:
        print(f"Weather API error: {e}")
        return {"temp_c": 25.0, "humidity": 50.0, "rainfall_mm": 0.0}


def fetch_weather_forecast(lat: float, lng: float, days: int = 7) -> list[dict]:
    """
    Fetch multi-day weather forecast from Open-Meteo API.
    Returns list of daily forecasts with date, temp_max, temp_min, rainfall, humidity.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lng}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean"
        f"&forecast_days={days}"
    )
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'CropGuard/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            daily = data.get("daily", {})
            dates = daily.get("time", [])
            temp_max = daily.get("temperature_2m_max", [])
            temp_min = daily.get("temperature_2m_min", [])
            precip = daily.get("precipitation_sum", [])
            humidity = daily.get("relative_humidity_2m_mean", [])

            forecasts = []
            for i, d in enumerate(dates):
                forecasts.append({
                    "date": d,
                    "temp_max_c": temp_max[i] if i < len(temp_max) else 30.0,
                    "temp_min_c": temp_min[i] if i < len(temp_min) else 20.0,
                    "rainfall_mm": precip[i] if i < len(precip) else 0.0,
                    "humidity_pct": humidity[i] if i < len(humidity) else 50.0,
                })
            return forecasts
    except Exception as e:
        print(f"Forecast API error: {e}")
        return _mock_forecast(lat, lng, days)


def _mock_forecast(lat: float, lng: float, days: int = 7) -> list[dict]:
    """Deterministic mock forecast for offline/testing."""
    from datetime import date, timedelta
    forecasts = []
    today = date.today()
    for i in range(days):
        d = today + timedelta(days=i)
        seed = int(hashlib.sha256(f"{lat}-{lng}-{d.isoformat()}".encode()).hexdigest(), 16)
        temp_base = 25 + (seed % 15)
        rain = (seed % 100) / 10.0  # 0-10mm
        humid = 40 + (seed % 50)
        forecasts.append({
            "date": d.isoformat(),
            "temp_max_c": round(temp_base + 5, 1),
            "temp_min_c": round(temp_base - 5, 1),
            "rainfall_mm": round(rain, 1),
            "humidity_pct": round(humid, 1),
        })
    return forecasts
