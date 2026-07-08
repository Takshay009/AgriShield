import os
import json
import requests
from datetime import datetime, timedelta

SH_CLIENT_ID = os.getenv("SH_CLIENT_ID")
SH_CLIENT_SECRET = os.getenv("SH_CLIENT_SECRET")

def get_sh_token():
    if not SH_CLIENT_ID or not SH_CLIENT_SECRET:
        return None
    url = "https://services.sentinel-hub.com/oauth/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": SH_CLIENT_ID,
        "client_secret": SH_CLIENT_SECRET
    }
    try:
        resp = requests.post(url, data=payload)
        resp.raise_for_status()
        return resp.json().get("access_token")
    except Exception as e:
        print(f"Sentinel Hub Auth Error: {e}")
        return None

def fetch_real_ndvi(farm_id: str, boundary_geojson: str, date_str: str) -> float:
    token = get_sh_token()
    if not token:
        # Fallback to mock if API keys not set or auth failed
        from services.core import mock_ndvi
        return mock_ndvi(farm_id, date_str)
        
    try:
        polygon = json.loads(boundary_geojson)
        # Ensure it's a closed polygon required by Sentinel
        if polygon[0] != polygon[-1]:
            polygon.append(polygon[0])
    except Exception:
        # Fallback if invalid geojson
        from services.core import mock_ndvi
        return mock_ndvi(farm_id, date_str)

    # Sentinel Hub Statistical API Request
    url = "https://services.sentinel-hub.com/api/v1/statistics"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    time_from = (dt - timedelta(days=30)).strftime("%Y-%m-%dT00:00:00Z")
    time_to = dt.strftime("%Y-%m-%dT23:59:59Z")

    evalscript = """
    //VERSION=3
    function setup() {
        return {
            input: ["B04", "B08", "dataMask"],
            output: [
                { id: "default", bands: 1 },
                { id: "dataMask", bands: 1 }
            ]
        };
    }
    function evaluatePixel(samples) {
        let ndvi = (samples.B08 - samples.B04) / (samples.B08 + samples.B04);
        return {
            default: [ndvi],
            dataMask: [samples.dataMask]
        };
    }
    """

    payload = {
        "input": {
            "bounds": {
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [polygon]
                }
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "mosaickingOrder": "leastCC"
                }
            }]
        },
        "aggregation": {
            "timeRange": {
                "from": time_from,
                "to": time_to
            },
            "aggregationInterval": {
                "of": "P30D"
            },
            "evalscript": evalscript
        }
    }

    try:
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        
        # Parse the statistics response to get mean NDVI
        stats = data.get("data", [])
        if stats and len(stats) > 0:
            outputs = stats[0].get("outputs", {})
            default_stats = outputs.get("default", {}).get("bands", {})
            b0_stats = default_stats.get("B0", {})
            mean_ndvi = b0_stats.get("stats", {}).get("mean")
            if mean_ndvi is not None:
                return round(float(mean_ndvi), 3)
    except Exception as e:
        print(f"Sentinel Hub Stat API Error: {e}")

    # Fallback if API fails
    from services.core import mock_ndvi
    return mock_ndvi(farm_id, date_str)
