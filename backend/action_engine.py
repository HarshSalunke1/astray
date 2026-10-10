import time
from database import get_db

def add_task_action(title, subtext="DBMS · 1 hour", accent="#00f2fe"):
    conn = get_db()
    cursor = conn.cursor()
    task_id = f"task-{int(time.time() * 1000)}"
    cursor.execute(
        "INSERT INTO tasks VALUES (?, ?, ?, ?, ?)",
        (task_id, title, subtext, 0, accent)
    )
    
    # Log Activity
    act_id = f"act-{int(time.time() * 1000)}"
    cursor.execute(
        "INSERT INTO recent_activities VALUES (?, ?, ?, ?)",
        (act_id, f"Added task: {title}", "Just now", accent)
    )

    conn.commit()
    conn.close()

    return {
        "success": True,
        "task_id": task_id,
        "title": title,
        "message": f"Created task '{title}' successfully."
    }

def add_calendar_event_action(title, time_str="7:00 PM", duration="19:00 – 21:00", location="Focus session", dot_color="#f59e0b"):
    conn = get_db()
    cursor = conn.cursor()
    event_id = f"sch-{int(time.time() * 1000)}"
    cursor.execute(
        "INSERT INTO calendar_events VALUES (?, ?, ?, ?, ?, ?)",
        (event_id, time_str, duration, title, location, dot_color)
    )

    # Log Activity
    act_id = f"act-{int(time.time() * 1000)}"
    cursor.execute(
        "INSERT INTO recent_activities VALUES (?, ?, ?, ?)",
        (act_id, f"Synced event '{title}' to Calendar", "Just now", "#00f2fe")
    )

    conn.commit()
    conn.close()

    return {
        "success": True,
        "event_id": event_id,
        "title": title,
        "message": f"Added '{title}' ({duration}) to calendar with 6:45 PM reminder alert."
    }

def add_personal_memory_action(category, title, content, confidence="98%", source="Voice / Chat"):
    conn = get_db()
    cursor = conn.cursor()
    mem_id = f"mem-{int(time.time() * 1000)}"
    date_str = time.strftime("%Y-%m-%d")
    
    cursor.execute(
        "INSERT INTO personal_memories VALUES (?, ?, ?, ?, ?, ?, ?)",
        (mem_id, category, title, content, confidence, source, date_str)
    )

    # Log Activity
    act_id = f"act-{int(time.time() * 1000)}"
    cursor.execute(
        "INSERT INTO recent_activities VALUES (?, ?, ?, ?)",
        (act_id, f"Remembered: {title}", "Just now", "#00f2fe")
    )

    conn.commit()
    conn.close()

    return {
        "success": True,
        "memory_id": mem_id,
        "title": title,
        "message": f"Stored in persistent long-term memory: '{title}'"
    }
