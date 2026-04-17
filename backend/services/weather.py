import os, httpx
from datetime import datetime, timezone

OWM_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY", "")
AQICN_API_KEY = os.getenv("AQICN_API_KEY", "")

CITY_COORDS = {
    "chennai": {"lat": 13.0827, "lon": 80.2707, "aqicn_station": "@7021"},
    "bangalore": {"lat": 12.9716, "lon": 77.5946, "aqicn_station": "@7022"}
}

RAIN_THRESHOLD_MM = 30.0    # mm/hour triggers RAIN event
AQI_THRESHOLD = 200         # AQI > 200 triggers AQI event (Very Unhealthy)

async def fetch_live_weather(city: str) -> dict:
    """
    Calls OpenWeatherMap Current Weather API.
    Returns dict: {city, rain_1h_mm, temp_celsius, description, timestamp}
    On API error or missing key, returns a safe default dict with rain_1h_mm=0.
    """
    city_lower = city.lower()
    coords = CITY_COORDS.get(city_lower)
    if not coords or not OWM_API_KEY:
        return {"city": city, "rain_1h_mm": 0.0, "temp_celsius": 30.0,
                "description": "unavailable", "timestamp": datetime.now(timezone.utc).isoformat()}
    url = (f"https://api.openweathermap.org/data/2.5/weather"
           f"?lat={coords['lat']}&lon={coords['lon']}&appid={OWM_API_KEY}&units=metric")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        rain_mm = data.get("rain", {}).get("1h", 0.0)
        temp = data.get("main", {}).get("temp", 30.0)
        desc = data.get("weather", [{}])[0].get("description", "")
        return {"city": city, "rain_1h_mm": rain_mm, "temp_celsius": temp,
                "description": desc, "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        return {"city": city, "rain_1h_mm": 0.0, "temp_celsius": 30.0,
                "description": f"error: {e}", "timestamp": datetime.now(timezone.utc).isoformat()}

async def fetch_live_aqi(city: str) -> dict:
    """
    Calls AQICN API for current AQI.
    Returns dict: {city, aqi, timestamp}
    On error returns aqi=0.
    """
    city_lower = city.lower()
    coords = CITY_COORDS.get(city_lower)
    if not coords or not AQICN_API_KEY:
        return {"city": city, "aqi": 0, "timestamp": datetime.now(timezone.utc).isoformat()}
    station = coords["aqicn_station"]
    url = f"https://api.waqi.info/feed/{station}/?token={AQICN_API_KEY}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        aqi = int(data.get("data", {}).get("aqi", 0))
        return {"city": city, "aqi": aqi, "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        return {"city": city, "aqi": 0, "timestamp": datetime.now(timezone.utc).isoformat()}

def should_trigger_rain(rain_mm: float) -> bool:
    return rain_mm >= RAIN_THRESHOLD_MM

def should_trigger_aqi(aqi: int) -> bool:
    return aqi >= AQI_THRESHOLD

def compute_rain_severity(rain_mm: float) -> float:
    """Returns severity 0.0-1.0. 30mm = 0.5, 80mm = 1.0"""
    return round(min((rain_mm - RAIN_THRESHOLD_MM) / 50.0 + 0.5, 1.0), 3)

def compute_aqi_severity(aqi: int) -> float:
    """Returns severity 0.0-1.0. 200 AQI = 0.5, 400 AQI = 1.0"""
    return round(min((aqi - AQI_THRESHOLD) / 200.0 + 0.5, 1.0), 3)
