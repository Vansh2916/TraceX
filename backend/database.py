import sqlite3
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from backend.engine import DELHI_CAMERAS, haversine_km

DB_FILE = "crusaders.db"

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS cameras (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        landmark TEXT,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        zone TEXT NOT NULL,
        speed_limit INTEGER NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS watchlist (
        plate TEXT PRIMARY KEY,
        reason TEXT NOT NULL,
        severity TEXT NOT NULL, -- CRITICAL, HIGH, MEDIUM
        added_at TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'ACTIVE'
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS sightings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        timestamp_sec REAL NOT NULL,
        iso_time TEXT NOT NULL,
        speed_kmh REAL NOT NULL,
        confidence REAL NOT NULL,
        vehicle_type TEXT,
        color TEXT,
        flags TEXT NOT NULL, -- JSON list string e.g. ["NORMAL"]
        FOREIGN KEY (camera_id) REFERENCES cameras (id)
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        plate TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        timestamp_sec REAL NOT NULL,
        iso_time TEXT NOT NULL,
        severity TEXT NOT NULL,
        details TEXT NOT NULL, -- JSON string
        status TEXT DEFAULT 'UNRESOLVED'
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS live_streaming_vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT NOT NULL,
        car_model TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        color TEXT NOT NULL,
        speed_kmh REAL NOT NULL,
        speed_limit REAL NOT NULL,
        is_overspeed INTEGER NOT NULL,
        station_id TEXT NOT NULL,
        station_name TEXT NOT NULL,
        corridor TEXT,
        timestamp_sec REAL NOT NULL,
        iso_time TEXT NOT NULL,
        confidence REAL NOT NULL,
        detection_engine TEXT NOT NULL,
        flags TEXT
    );
    """)

    # Indices for high-performance ANPR queries
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sightings_plate ON sightings(plate);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sightings_cam_time ON sightings(camera_id, timestamp_sec);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sightings_time ON sightings(timestamp_sec DESC);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts(timestamp_sec DESC);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_live_vehicles_time ON live_streaming_vehicles(timestamp_sec DESC);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_live_vehicles_plate ON live_streaming_vehicles(plate);")

    conn.commit()
    conn.close()

def seed_db_if_empty():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) as count FROM sightings")
    cnt = cur.fetchone()["count"]
    if cnt > 20:
        conn.close()  # FIX BUG 1: close only on early return, not before seeding
        return

    print("[Crusaders DB] Seeding initial real Delhi traffic & intelligence records...")
    from backend.seed_real_data import seed_real_delhi_surveillance
    seed_real_delhi_surveillance()

    # FIX BUG 5: seed_real_delhi_surveillance() already inserts cameras, watchlist,
    # sightings, and alerts — the duplicate block below has been removed to prevent
    # UNIQUE constraint failures on cameras.id and watchlist.plate.
    print("[Crusaders DB] Database initialization and seed completed.")

def insert_live_streaming_vehicle(
    plate: str,
    car_model: str,
    vehicle_type: str,
    color: str,
    speed_kmh: float,
    station_id: str,
    station_name: str = "",
    corridor: str = "",
    speed_limit: float = 50.0,
    confidence: float = 0.98,
    detection_engine: str = "NVIDIA NIM + Native ANPR",
    flags: Optional[List[str]] = None,
    timestamp_sec: Optional[float] = None
) -> Dict[str, Any]:
    """Records a live streaming vehicle passing through a CCTV camera station into database."""
    conn = get_db_connection()
    cur = conn.cursor()
    now_t = timestamp_sec if timestamp_sec else time.time()
    iso = datetime.fromtimestamp(now_t).isoformat() + "Z"
    is_over = 1 if speed_kmh > speed_limit else 0
    flags_json = json.dumps(flags or (["SPEED_VIOLATION"] if is_over else ["NORMAL"]))

    if not station_name:
        cam_info = DELHI_CAMERAS.get(station_id, {})
        station_name = cam_info.get("name", station_id)
        if not corridor:
            corridor = f"{cam_info.get('landmark', '')} Corridor"

    cur.execute("""
    INSERT INTO live_streaming_vehicles (
        plate, car_model, vehicle_type, color, speed_kmh, speed_limit,
        is_overspeed, station_id, station_name, corridor, timestamp_sec,
        iso_time, confidence, detection_engine, flags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        plate.strip().upper(), car_model, vehicle_type, color, speed_kmh, speed_limit,
        is_over, station_id, station_name, corridor, now_t, iso, confidence,
        detection_engine, flags_json
    ))
    row_id = cur.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": row_id,
        "plate": plate.strip().upper(),
        "car_model": car_model,
        "vehicle_type": vehicle_type,
        "color": color,
        "speed_kmh": speed_kmh,
        "speed_limit": speed_limit,
        "is_overspeed": bool(is_over),
        "station_id": station_id,
        "station_name": station_name,
        "corridor": corridor,
        "timestamp_sec": now_t,
        "iso_time": iso,
        "confidence": confidence,
        "detection_engine": detection_engine,
        "flags": flags or []
    }

def get_live_streaming_vehicles(limit: int = 100, station_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetches all passing live streaming vehicles stored in the database."""
    conn = get_db_connection()
    cur = conn.cursor()
    if station_id:
        cur.execute("SELECT * FROM live_streaming_vehicles WHERE station_id = ? ORDER BY timestamp_sec DESC LIMIT ?", (station_id, limit))
    else:
        cur.execute("SELECT * FROM live_streaming_vehicles ORDER BY timestamp_sec DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows
