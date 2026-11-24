"""
Requirement 4: Isolated QA Environment Configuration and Deterministic Seeding.
Provides isolated database path, deterministic camera fixtures, and repeatable scenarios.
"""
import os
import sqlite3
import time
from typing import Dict, Any, List

QA_DB_PATH = os.path.join(os.path.dirname(__file__), "crusaders_qa.db")

DETERMINISTIC_QA_CAMERAS = [
    {"id": "QA_CAM_01", "name": "QA Connaught Place North", "lat": 28.6328, "lon": 77.2197, "zone": "QA Central", "speed_limit": 50},
    {"id": "QA_CAM_02", "name": "QA India Gate C-Hexagon", "lat": 28.6129, "lon": 77.2295, "zone": "QA Central", "speed_limit": 60},
    {"id": "QA_CAM_03", "name": "QA ITO Vikas Marg", "lat": 28.6289, "lon": 77.2410, "zone": "QA East", "speed_limit": 50},
]

DETERMINISTIC_QA_SIGHTINGS = [
    {
        "plate": "QA-TEST-001",
        "camera_id": "QA_CAM_01",
        "timestamp_sec": 1700000000,
        "iso_time": "2023-11-14T22:13:20",
        "speed_kmh": 45.0,
        "confidence": 0.98,
        "vehicle_type": "Sedan",
        "color": "Silver",
        "flags": '["NORMAL"]'
    },
    {
        "plate": "QA-TEST-001",
        "camera_id": "QA_CAM_02",
        "timestamp_sec": 1700000600,
        "iso_time": "2023-11-14T22:23:20",
        "speed_kmh": 52.0,
        "confidence": 0.97,
        "vehicle_type": "Sedan",
        "color": "Silver",
        "flags": '["NORMAL"]'
    },
    {
        "plate": "QA-OVERSPEED-99",
        "camera_id": "QA_CAM_03",
        "timestamp_sec": 1700001000,
        "iso_time": "2023-11-14T22:30:00",
        "speed_kmh": 92.0,
        "confidence": 0.99,
        "vehicle_type": "SUV",
        "color": "Black",
        "flags": '["SPEED_VIOLATION"]'
    }
]

def init_qa_database(db_path: str = QA_DB_PATH) -> sqlite3.Connection:
    """Initializes a completely isolated QA database with deterministic schemas."""
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE cameras (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            zone TEXT NOT NULL,
            speed_limit INTEGER NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE sightings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate TEXT NOT NULL,
            camera_id TEXT NOT NULL,
            timestamp_sec REAL NOT NULL,
            iso_time TEXT NOT NULL,
            speed_kmh REAL NOT NULL,
            confidence REAL NOT NULL,
            vehicle_type TEXT,
            color TEXT,
            flags TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT NOT NULL,
            plate TEXT NOT NULL,
            camera_id TEXT NOT NULL,
            timestamp_sec REAL NOT NULL,
            iso_time TEXT NOT NULL,
            severity TEXT NOT NULL,
            details TEXT NOT NULL,
            status TEXT DEFAULT 'UNRESOLVED'
        )
    """)
    cur.execute("""
        CREATE TABLE watchlist (
            plate TEXT PRIMARY KEY,
            reason TEXT NOT NULL,
            severity TEXT NOT NULL,
            added_at TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'ACTIVE'
        )
    """)

    # Seed deterministic fixtures
    for cam in DETERMINISTIC_QA_CAMERAS:
        cur.execute("INSERT INTO cameras VALUES (?, ?, ?, ?, ?, ?)", (
            cam["id"], cam["name"], cam["lat"], cam["lon"], cam["zone"], cam["speed_limit"]
        ))

    for s in DETERMINISTIC_QA_SIGHTINGS:
        cur.execute("""
            INSERT INTO sightings (plate, camera_id, timestamp_sec, iso_time, speed_kmh, confidence, vehicle_type, color, flags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s["plate"], s["camera_id"], s["timestamp_sec"], s["iso_time"],
            s["speed_kmh"], s["confidence"], s["vehicle_type"], s["color"], s["flags"]
        ))

    conn.commit()
    return conn
