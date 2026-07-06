"""
Dry-Spell Scheduler — Phase 2B
Runs scheduled checks across all registered farms to predict dry spells and generate automated advisory alerts.
"""
from datetime import datetime
from database import SessionLocal
import models
from weather_service import fetch_weather_forecast
from advisory_engine import analyze_forecast
from sms_service import send_sms

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    HAS_APSCHEDULER = True
except ImportError:
    HAS_APSCHEDULER = False

scheduler = None


def check_all_farms_for_dry_spells():
    """Iterate over all farms and check 7-day forecast for dry spells."""
    db = SessionLocal()
    try:
        farms = db.query(models.Farm).all()
        print(f"[{datetime.utcnow().isoformat()}] Running dry-spell check for {len(farms)} farms...")
        for farm in farms:
            forecast = fetch_weather_forecast(float(farm.lat), float(farm.lng))
            alerts = analyze_forecast(forecast, farm_id=farm.id, crop_name=getattr(farm, 'crop_type', None))
            for alert in alerts:
                if alert["alert_type"] in ["dry_spell", "heat_wave"]:
                    print(f"-> Alert for Farm #{farm.id} ({farm.name}): {alert['title']}")
                    user = db.query(models.User).filter(models.User.id == farm.user_id).first()
                    if user and user.phone:
                        msg = f"🌾 AgriShield ALERT for {farm.name}: {alert['message']} Action: {alert['recommended_action']}"
                        print(f"[Auto-Push] Broadcasting SMS alert to {user.phone}...")
                        send_sms(user.phone, msg)
    except Exception as e:
        print(f"Dry-spell scheduler error: {e}")
    finally:
        db.close()


def start_scheduler():
    global scheduler
    if HAS_APSCHEDULER:
        scheduler = BackgroundScheduler()
        # Run once every 24 hours
        scheduler.add_job(check_all_farms_for_dry_spells, 'interval', hours=24)
        scheduler.start()
        print("APScheduler started: Dry-spell check scheduled every 24 hours.")
    else:
        print("APScheduler not installed. Using on-demand dry-spell evaluation.")


def stop_scheduler():
    global scheduler
    if scheduler and HAS_APSCHEDULER:
        scheduler.shutdown()
