from fastapi import APIRouter
from services.weather import fetch_live_weather, fetch_live_aqi

router = APIRouter()

@router.get("/current")
async def get_current_weather(city: str):
    weather_data = await fetch_live_weather(city)
    aqi_data = await fetch_live_aqi(city)
    
    # Merge both results
    return {
        **weather_data,
        "aqi": aqi_data.get("aqi", 0)
    }
