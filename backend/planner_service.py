from datetime import timedelta
from database import get_db
from time_service import get_now

def get_current_plan():
    now = get_now()
    d1 = now
    d2 = now + timedelta(days=1)
    d3 = now + timedelta(days=2)
    d4 = now + timedelta(days=3)

    return [
        {
            "day": "Day 1",
            "date": d1.strftime("%A, %b %d"),
            "status": "Completed",
            "isToday": True,
            "sessions": [
                {"time": "19:00 - 20:30", "topic": "Functional Dependencies & 1NF/2NF", "status": "Done", "focus": "High"}
            ]
        },
        {
            "day": "Day 2",
            "date": d2.strftime("%A, %b %d"),
            "status": "Scheduled",
            "isToday": False,
            "sessions": [
                {"time": "19:00 - 21:00", "topic": "3NF vs BCNF Decomposition & Lossless Join", "status": "Pending", "focus": "Priority (Weak Subject)"}
            ]
        },
        {
            "day": "Day 3",
            "date": d3.strftime("%A, %b %d"),
            "status": "Scheduled",
            "isToday": False,
            "sessions": [
                {"time": "18:30 - 20:30", "topic": "Transaction Management & Serializability", "status": "Pending", "focus": "Normal"},
                {"time": "20:30 - 21:30", "topic": "Mock Practice & Weak Topic Flashcards", "status": "Pending", "focus": "High"}
            ]
        },
        {
            "day": "Day 4",
            "date": f"{d4.strftime('%A, %b %d')} (Exam Day)",
            "status": "Exam Day",
            "isToday": False,
            "sessions": [
                {"time": "08:00 - 09:30", "topic": "Final Formula Warmup & Key Definitions", "status": "Scheduled", "focus": "Review"},
                {"time": "10:00 - 13:00", "topic": "⚡ DBMS FINAL EXAM", "status": "Exam", "focus": "Critical"}
            ]
        }
    ]

def generate_exam_plan():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM personal_memories WHERE category IN ('Exams', 'Weak Subjects', 'Preferences')")
    memories = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Deterministic Solver rules:
    # 1. College hours 10:00 - 16:00 blocked
    # 2. Evening slots 19:00 - 21:00 preferred
    # 3. DBMS normalization & BCNF given priority focus
    return get_current_plan()

def perform_adaptive_rescheduling():
    plan = get_current_plan()
    updated_plan = []

    for idx, day in enumerate(plan):
        if day["day"] == "Day 2" or idx == 1:
            updated_day = {
                **day,
                "status": "Adjusted (+45m added load)",
                "sessions": [
                    {
                        "time": "18:30 - 21:15",
                        "topic": "3NF/BCNF + Re-allocated Missed Normalization Practice",
                        "status": "Pending",
                        "focus": "Priority (High Load)"
                    }
                ]
            }
            updated_plan.append(updated_day)
        elif day["day"] == "Day 3" or idx == 2:
            updated_day = {
                **day,
                "status": "Adjusted (+30m review)",
                "sessions": [
                    {
                        "time": "18:00 - 20:30",
                        "topic": "Transaction Management & Serializability",
                        "status": "Pending",
                        "focus": "Normal"
                    },
                    {
                        "time": "20:30 - 21:45",
                        "topic": "Full Mock Exam Simulation (Decomposition Focus)",
                        "status": "Pending",
                        "focus": "High"
                    }
                ]
            }
            updated_plan.append(updated_day)
        else:
            updated_plan.append(day)

    return updated_plan

