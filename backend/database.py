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
    conn.close()
    if cnt > 20:
        return

    print("[Crusaders DB] Seeding initial real Delhi traffic & intelligence records...")
    from backend.seed_real_data import seed_real_delhi_surveillance
    seed_real_delhi_surveillance()

    # 1. Seed Cameras
    for cam_id, meta in DELHI_CAMERAS.items():
        cur.execute("""
            INSERT INTO cameras (id, name, landmark, lat, lon, zone, speed_limit)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (cam_id, meta["name"], meta["landmark"], meta["lat"], meta["lon"], meta["zone"], meta["speed_limit"]))

    # 2. Seed Watchlist
    watchlist_items = [
        ("DL 1C WX 0007", "Hit-and-Run Suspect (Fatal pedestrian collision on Vikas Marg)", "CRITICAL", "High-priority red alert issued by Delhi Traffic Police HQ"),
        ("DL 8C AB 9110", "Duplicate / Cloned Registration Flagged", "CRITICAL", "Identical plate spotted concurrently in two distinct revenue districts"),
        ("HR 51 BZ 4321", "Wanted Narcotics Transit Vehicle", "HIGH", "Suspected inter-state delivery courier operating along NH-48"),
        ("UP 14 DX 1234", "Stolen Black SUV (Armed carjacking FIR 412/26)", "HIGH", "Reported stolen from Sector 18 border"),
        ("DL 3C CC 1122", "Unregistered Armed Escort Formation", "MEDIUM", "Associated with unpermitted multi-vehicle convoy")
    ]
    now_str = datetime.now().isoformat()
    for plate, reason, severity, desc in watchlist_items:
        cur.execute("""
            INSERT INTO watchlist (plate, reason, severity, added_at, description, status)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE')
        """, (plate, reason, severity, now_str, desc))

    # 3. Seed Realistic Traffic Sightings
    now_sec = time.time()
    seed_sightings = []

    # A) Convoy Pair across 4 junctions: CAM_07 -> CAM_06 -> CAM_09 -> CAM_05
    # Plate 1: DL 1C AA 9999 (White Scorpio-N)
    # Plate 2: HR 26 DQ 8888 (Black Fortuner)
    convoy_route = [
        ("CAM_07", now_sec - 1200),
        ("CAM_06", now_sec - 850),
        ("CAM_09", now_sec - 730),
        ("CAM_05", now_sec - 520),
    ]
    for cid, t in convoy_route:
        # Leader
        seed_sightings.append((
            "DL 1C AA 9999", cid, t, datetime.fromtimestamp(t).isoformat(),
            64.5, 0.96, "SUV", "White", json.dumps(["NORMAL", "CONVOY_CANDIDATE"])
        ))
        # Follower (arriving 18-24 seconds later)
        t_follower = t + 22
        seed_sightings.append((
            "HR 26 DQ 8888", cid, t_follower, datetime.fromtimestamp(t_follower).isoformat(),
            66.0, 0.94, "SUV", "Black", json.dumps(["NORMAL", "CONVOY_CANDIDATE"])
        ))

    # B) Seeded Speed Violation: UP 16 Z 4455 on Dhaula Kuan
    t_speed = now_sec - 1800
    seed_sightings.append((
        "UP 16 Z 4455", "CAM_06", t_speed, datetime.fromtimestamp(t_speed).isoformat(),
        94.2, 0.93, "Sedan", "Silver", json.dumps(["SPEED_VIOLATION"])
    ))

    # C) Airport VIP fleet shuttling CAM_07 <-> CAM_06
    airport_fleet = [
        ("DL 3C CC 1122", "CAM_07", now_sec - 2400, 55.0, 0.95, "SUV", "Black", ["WATCHLIST_MATCH"]),
        ("DL 3C CC 1122", "CAM_06", now_sec - 2020, 68.0, 0.97, "SUV", "Black", ["WATCHLIST_MATCH"]),
        ("HR 26 BY 5500", "CAM_07", now_sec - 3100, 48.0, 0.91, "Van", "White", ["NORMAL"]),
        ("DL 2C AK 1001", "CAM_07", now_sec - 1500, 52.0, 0.98, "Sedan", "White", ["NORMAL"]),
    ]
    for plate, cid, t, spd, conf, vtype, col, flg in airport_fleet:
        seed_sightings.append((
            plate, cid, t, datetime.fromtimestamp(t).isoformat(),
            spd, conf, vtype, col, json.dumps(flg)
        ))

    # D) General Ambient City Traffic across all junctions
    ambient_vehicles = [
        ("DL 9C AB 1234", "Hatchback", "Red"),
        ("DL 4C XY 9081", "Sedan", "White"),
        ("HR 51 AQ 7711", "SUV", "Grey"),
        ("DL 1C EF 3344", "Auto-Rickshaw", "Yellow-Green"),
        ("UP 14 BK 6520", "Bus", "Orange"),
        ("DL 8C JK 4912", "Sedan", "Blue"),
        ("DL 7C MM 3120", "Motorcycle", "Black"),
        ("HR 29 AZ 9002", "Truck", "Brown"),
        ("DL 10 C 8821", "SUV", "White"),
        ("DL 1C BB 4490", "Sedan", "Silver"),
        ("UP 16 ER 5521", "Hatchback", "White"),
        ("DL 5C PQ 6214", "Van", "Silver"),
    ]

    # Generate sequential tracks for some ambient vehicles
    trajectories = [
        ("DL 9C AB 1234", [("CAM_01", now_sec - 2700), ("CAM_02", now_sec - 2520), ("CAM_12", now_sec - 2310)]),
        ("DL 4C XY 9081", [("CAM_04", now_sec - 3600), ("CAM_01", now_sec - 3340), ("CAM_11", now_sec - 3120)]),
        ("HR 51 AQ 7711", [("CAM_05", now_sec - 1900), ("CAM_10", now_sec - 1720), ("CAM_08", now_sec - 1600)]),
        ("DL 8C JK 4912", [("CAM_03", now_sec - 1400), ("CAM_01", now_sec - 1260), ("CAM_02", now_sec - 1100)]),
        ("DL 10 C 8821", [("CAM_11", now_sec - 2200), ("CAM_06", now_sec - 1880), ("CAM_07", now_sec - 1500)]),
    ]

    for plate, path in trajectories:
        v_info = next((v for v in ambient_vehicles if v[0] == plate), (plate, "Sedan", "Silver"))
        for cid, t in path:
            seed_sightings.append((
                plate, cid, t, datetime.fromtimestamp(t).isoformat(),
                48.0, 0.95, v_info[1], v_info[2], json.dumps(["NORMAL"])
            ))

    # Add single sightings for other cameras
    cam_keys = list(DELHI_CAMERAS.keys())
    for idx, (plate, vtype, col) in enumerate(ambient_vehicles):
        cid = cam_keys[idx % len(cam_keys)]
        t = now_sec - (idx * 210 + 300)
        seed_sightings.append((
            plate, cid, t, datetime.fromtimestamp(t).isoformat(),
            45.0 + (idx % 15), 0.92, vtype, col, json.dumps(["NORMAL"])
        ))

    for s in seed_sightings:
        cur.execute("""
            INSERT INTO sightings (plate, camera_id, timestamp_sec, iso_time, speed_kmh, confidence, vehicle_type, color, flags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, s)

    # 4. Seed Initial Alerts
    initial_alerts = [
        ("SPEED_VIOLATION", "UP 16 Z 4455", "CAM_06", t_speed, datetime.fromtimestamp(t_speed).isoformat(), "HIGH",
         json.dumps({
             "speed_kmh": 94.2,
             "limit_kmh": 70,
             "camera_name": "Dhaula Kuan Interchange",
             "message": "Vehicle recorded at 94.2 km/h on NH48 corridor, exceeding 70 km/h threshold."
         })),
        ("CONVOY_DETECTED", "DL 1C AA 9999", "CAM_05", now_sec - 520, datetime.fromtimestamp(now_sec - 520).isoformat(), "HIGH",
         json.dumps({
             "plates": ["DL 1C AA 9999", "HR 26 DQ 8888"],
             "co_occurrence_count": 4,
             "cameras": ["CAM_07", "CAM_06", "CAM_09", "CAM_05"],
             "message": "Tactical convoy pair co-occurring within 25 seconds across 4 consecutive Ring Road junctions."
         })),
        ("WATCHLIST_HIT", "DL 3C CC 1122", "CAM_06", now_sec - 2020, datetime.fromtimestamp(now_sec - 2020).isoformat(), "MEDIUM",
         json.dumps({
             "plate": "DL 3C CC 1122",
             "reason": "Unregistered Armed Escort Formation",
             "camera_name": "Dhaula Kuan Interchange",
             "message": "Flagged surveillance target spotted moving from IGI Airport towards Dhaula Kuan."
         }))
    ]

    for alert in initial_alerts:
        cur.execute("""
            INSERT INTO alerts (alert_type, plate, camera_id, timestamp_sec, iso_time, severity, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'UNRESOLVED')
        """, alert)

    conn.commit()
    conn.close()
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
