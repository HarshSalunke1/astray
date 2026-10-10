import os
from datetime import datetime
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

load_dotenv()

DEFAULT_TIMEZONE = os.getenv("TIMEZONE", "Asia/Kolkata")

def get_tz():
    try:
        return ZoneInfo(DEFAULT_TIMEZONE)
    except Exception:
        return ZoneInfo("Asia/Kolkata")

def get_now():
    """Return timezone-aware current datetime."""
    return datetime.now(get_tz())

def get_system_time_context():
    """Return a comprehensive dictionary with current date, time, day of week, and timezone."""
    now = get_now()
    return {
        "iso_datetime": now.isoformat(),
        "day_of_week": now.strftime("%A"),
        "date_str": now.strftime("%B %d, %Y"),
        "short_date": now.strftime("%Y-%m-%d"),
        "display_date": now.strftime("%A, %b %d %Y").upper(),
        "today_schedule_header": now.strftime("%A, %B %d"),
        "time_str": now.strftime("%I:%M %p").lstrip("0"),
        "timezone": str(get_tz())
    }

if __name__ == "__main__":
    print(get_system_time_context())
