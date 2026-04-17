from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

def start_scheduler(db_session_factory, trigger_service_fn):
    """
    db_session_factory: callable that returns a new DB session
    trigger_service_fn: async callable(city, event_type, severity, db, source) that runs the full trigger pipeline
    Cities hardcoded: chennai, bangalore
    """
    async def poll_and_trigger():
        from services.weather import fetch_live_weather, fetch_live_aqi
        from services.weather import should_trigger_rain, should_trigger_aqi
        from services.weather import compute_rain_severity, compute_aqi_severity
        for city in ["chennai", "bangalore"]:
            db = list(db_session_factory())[0] if type(db_session_factory()) is type((yield)) else db_session_factory()
            
            # Since get_db in FastAPI often yields, it might be a generator.
            # Handle both function returning session and generator yielding session.
            import types
            if isinstance(db, types.GeneratorType):
                db = next(db)
                
            try:
                weather = await fetch_live_weather(city)
                if should_trigger_rain(weather["rain_1h_mm"]):
                    severity = compute_rain_severity(weather["rain_1h_mm"])
                    logger.info(f"AUTO-TRIGGER: RAIN in {city}, rain={weather['rain_1h_mm']}mm, severity={severity}")
                    await trigger_service_fn(city=city, event_type="RAIN",
                                             severity=severity, db=db,
                                             source="live_owm")
                
                aqi_data = await fetch_live_aqi(city)
                if should_trigger_aqi(aqi_data["aqi"]):
                    severity = compute_aqi_severity(aqi_data["aqi"])
                    logger.info(f"AUTO-TRIGGER: AQI in {city}, aqi={aqi_data['aqi']}, severity={severity}")
                    await trigger_service_fn(city=city, event_type="AQI",
                                             severity=severity, db=db,
                                             source="live_aqicn")
            except Exception as e:
                logger.error(f"Scheduler poll error for {city}: {e}")
            finally:
                db.close()

    scheduler.add_job(poll_and_trigger, IntervalTrigger(minutes=15),
                      id="weather_poll", replace_existing=True)
    scheduler.start()
    logger.info("APScheduler started: weather polling every 15 minutes")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
