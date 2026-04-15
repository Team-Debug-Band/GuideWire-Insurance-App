import random
from fastapi import APIRouter

router = APIRouter()

@router.get("/current")
def get_current_weather(city: str):
    # Mock weather data based on city
    # Rain in mm, AQI in standard index
    if city.lower() == "chennai":
        rain = random.uniform(0, 45) # 45mm = alert
        aqi = random.randint(80, 220) # 220 = alert
    else:
        rain = random.uniform(0, 20)
        aqi = random.randint(50, 150)
        
    return {
        "city": city,
        "rain_1h_mm": round(rain, 1),
        "aqi": aqi,
        "status": "ALERT" if rain > 30 or aqi > 200 else "NORMAL"
    }
