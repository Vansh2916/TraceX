import os
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

import json
import time
import random
import asyncio
import logging
from contextlib import asynccontextmanager  # FIX BUG 6: lifespan import
from datetime import datetime
from typing import Dict, List, Optional, Any

logger = logging.getLogger("crusaders.main")
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

try:
    from backend.database import init_db, seed_db_if_empty, get_db_connection, insert_live_streaming_vehicle, get_live_streaming_vehicles
    from backend.engine import city_engine, DELHI_CAMERAS, PCR_UNITS, haversine_km
    from backend.gemini_nl import execute_nl_to_sql
    from backend.vision_engine import analyze_vehicle_photo
    from backend.map_view import get_standalone_map_html
    from backend.rtsp_simulator import CAMERA_STREAM_PROFILES, get_all_camera_streams, get_ffmpeg_rtsp_command
    from backend.stream_worker import stream_worker
except ImportError:
    from database import init_db, seed_db_if_empty, get_db_connection, insert_live_streaming_vehicle, get_live_streaming_vehicles
    from engine import city_engine, DELHI_CAMERAS, PCR_UNITS, haversine_km
    from gemini_nl import execute_nl_to_sql
    from vision_engine import analyze_vehicle_photo
    from map_view import get_standalone_map_html
    from rtsp_simulator import CAMERA_STREAM_PROFILES, get_all_camera_streams, get_ffmpeg_rtsp_command
    from stream_worker import stream_worker

# FIX BUG 6: replace deprecated @app.on_event("startup") with lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_db_if_empty()
    # Start multi-junction background optical ANPR stream worker
    await stream_worker.start(process_and_record_sighting)
    yield
    # Stop background stream worker on shutdown
    await stream_worker.stop()

app = FastAPI(title="Crusaders — City-Wide ANPR Trajectory Intelligence", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# Pydantic Schemas
class SightingCreate(BaseModel):
    plate: str
    camera_id: str
    confidence: float = 0.95
    speed_kmh: Optional[float] = None
    vehicle_type: Optional[str] = "Sedan"
    color: Optional[str] = "White"
    timestamp_sec: Optional[float] = None

class AlibiRequest(BaseModel):
    plate: str
    claimed_lat: float
    claimed_lon: float
    claimed_time_sec: Optional[float] = None

class WatchlistCreate(BaseModel):
    plate: str
    reason: str
    severity: str = "HIGH"
    description: Optional[str] = ""

class NLQueryRequest(BaseModel):
    query: str

# Helper to process a sighting ingestion
async def process_and_record_sighting(
    plate: str,
    camera_id: str,
    confidence: float,
    vehicle_type: str = "Sedan",
    color: str = "White",
    forced_speed: Optional[float] = None,
    custom_timestamp: Optional[float] = None
) -> Dict[str, Any]:
    if camera_id not in DELHI_CAMERAS:
        raise ValueError(f"Unknown camera ID: {camera_id}")

    current_time_sec = custom_timestamp if custom_timestamp else time.time()
    iso_time = datetime.fromtimestamp(current_time_sec).isoformat()

    conn = get_db_connection()
    cur = conn.cursor()

    # Fetch previous sighting of this plate
    cur.execute("""
        SELECT camera_id, timestamp_sec, speed_kmh, flags
        FROM sightings
        WHERE plate = ?
        ORDER BY timestamp_sec DESC
        LIMIT 1
    """, (plate,))
    prev_row = cur.fetchone()
    prev_sighting = dict(prev_row) if prev_row else None

    # Inspect with Trajectory & Anomaly Engine
    inspection = city_engine.inspect_sighting(
        current_cam=camera_id,
        current_time_sec=current_time_sec,
        previous_sighting=prev_sighting,
        confidence=confidence
    )

    if not inspection["valid"]:
        conn.close()
        return {
            "success": False,
            "reason": inspection["reason"],
            "flags": inspection["flags"]
        }

    flags = list(inspection["flags"])
    calculated_speed = forced_speed if forced_speed is not None else inspection["speed_kmh"]
    if calculated_speed > 80.0 and "SPEED_VIOLATION" not in flags:
        flags.append("SPEED_VIOLATION")

    # Check Watchlist match
    cur.execute("SELECT reason, severity FROM watchlist WHERE plate = ? AND status = 'ACTIVE'", (plate,))
    watchlist_hit = cur.fetchone()
    if watchlist_hit:
        flags.append("WATCHLIST_MATCH")  # FIX BUG 10: flag name kept as WATCHLIST_MATCH

    # Predict Next Trajectory using Markov Chain Transition Matrix
    prev_cam = prev_sighting["camera_id"] if prev_sighting else None
    prediction = city_engine.predict_next_trajectory(current_cam=camera_id, prev_cam=prev_cam)

    # Insert Sighting Record
    cur.execute("""
        INSERT INTO sightings (plate, camera_id, timestamp_sec, iso_time, speed_kmh, confidence, vehicle_type, color, flags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (plate, camera_id, current_time_sec, iso_time, calculated_speed, confidence, vehicle_type, color, json.dumps(flags)))
    sighting_id = cur.lastrowid

    # Handle Alerts creation
    new_alerts = []
    if "GHOST_ALERT" in flags:
        ghost_details = inspection.get("anomaly_details", {})
        cur.execute("""
            INSERT INTO alerts (alert_type, plate, camera_id, timestamp_sec, iso_time, severity, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'UNRESOLVED')
        """, ("GHOST_ALERT", plate, camera_id, current_time_sec, iso_time, "CRITICAL", json.dumps(ghost_details)))
        new_alerts.append({
            "id": cur.lastrowid,
            "alert_type": "GHOST_ALERT",
            "plate": plate,
            "camera_id": camera_id,
            "severity": "CRITICAL",
            "details": ghost_details,
            "iso_time": iso_time
        })

    if "SPEED_VIOLATION" in flags:
        speed_details = {
            "speed_kmh": calculated_speed,
            "limit_kmh": DELHI_CAMERAS[camera_id]["speed_limit"],
            "camera_name": DELHI_CAMERAS[camera_id]["name"]
        }
        cur.execute("""
            INSERT INTO alerts (alert_type, plate, camera_id, timestamp_sec, iso_time, severity, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'UNRESOLVED')
        """, ("SPEED_VIOLATION", plate, camera_id, current_time_sec, iso_time, "HIGH", json.dumps(speed_details)))
        new_alerts.append({
            "id": cur.lastrowid,
            "alert_type": "SPEED_VIOLATION",
            "plate": plate,
            "camera_id": camera_id,
            "severity": "HIGH",
            "details": speed_details,
            "iso_time": iso_time
        })

    if watchlist_hit:
        wl_details = {
            "reason": watchlist_hit["reason"],
            "severity": watchlist_hit["severity"],
            "camera_name": DELHI_CAMERAS[camera_id]["name"],
            "predicted_next": prediction["top_predictions"],
            "pcr_dispatch": prediction["recommended_interception"]
        }
        cur.execute("""
            INSERT INTO alerts (alert_type, plate, camera_id, timestamp_sec, iso_time, severity, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'UNRESOLVED')
        """, ("WATCHLIST_MATCH", plate, camera_id, current_time_sec, iso_time, watchlist_hit["severity"], json.dumps(wl_details)))  # FIX BUG 10: alert_type now matches flag name WATCHLIST_MATCH
        new_alerts.append({
            "id": cur.lastrowid,
            "alert_type": "WATCHLIST_MATCH",  # FIX BUG 10: was WATCHLIST_HIT, now consistent with sighting flag
            "plate": plate,
            "camera_id": camera_id,
            "severity": watchlist_hit["severity"],
            "details": wl_details,
            "iso_time": iso_time
        })

    conn.commit()
    conn.close()

    sighting_payload = {
        "id": sighting_id,
        "plate": plate,
        "camera_id": camera_id,
        "camera_name": DELHI_CAMERAS[camera_id]["name"],
        "lat": DELHI_CAMERAS[camera_id]["lat"],
        "lon": DELHI_CAMERAS[camera_id]["lon"],
        "timestamp_sec": current_time_sec,
        "iso_time": iso_time,
        "speed_kmh": calculated_speed,
        "confidence": confidence,
        "vehicle_type": vehicle_type,
        "color": color,
        "flags": flags,
        "prediction": prediction,
        "prev_camera_id": prev_cam
    }

    # Broadcast via WebSocket
    await manager.broadcast({
        "type": "NEW_SIGHTING",
        "data": sighting_payload,
        "alerts": new_alerts
    })

    return {
        "success": True,
        "sighting": sighting_payload,
        "alerts": new_alerts
    }

# --- REST Endpoints ---

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Crusaders ANPR Trajectory Intelligence", "active_cameras": len(DELHI_CAMERAS)}

@app.get("/api/cameras")
def get_cameras():
    return {
        "cameras": list(DELHI_CAMERAS.values()),
        "geojson": city_engine.get_cameras_geojson()
    }

@app.get("/api/map", response_class=HTMLResponse)
def get_interactive_map():
    """
    Returns a fully interactive, standalone dark-mode Leaflet Map view
    integrated directly into the API, featuring CartoDB Dark Matter tiles,
    12 Delhi camera nodes, directed NetworkX arterial corridors, PCR patrol units,
    and real-time WebSocket telemetry.
    """
    return HTMLResponse(get_standalone_map_html())

@app.get("/api/map/state")
def get_map_state():
    """
    Returns the complete real-time map state including camera nodes,
    directed network edges, grouped vehicle trajectories with color codes,
    active alerts, and PCR unit coordinates.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.*, c.name as camera_name, c.lat, c.lon
        FROM sightings s
        JOIN cameras c ON s.camera_id = c.id
        ORDER BY s.timestamp_sec ASC
    """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    # Group trajectories by plate
    trajectories: Dict[str, Any] = {}
    for r in rows:
        try:
            r["flags"] = json.loads(r["flags"])
        except Exception:
            r["flags"] = [r["flags"]]

        plate = r["plate"]
        if plate not in trajectories:
            trajectories[plate] = {
                "plate": plate,
                "vehicle_type": r.get("vehicle_type", "Sedan"),
                "color": r.get("color", "White"),
                "waypoints": [],
                "flags": set(),
                "latest_speed_kmh": r.get("speed_kmh", 0)
            }
        trajectories[plate]["waypoints"].append({
            "camera_id": r["camera_id"],
            "camera_name": r["camera_name"],
            "coord": [r["lat"], r["lon"]],
            "timestamp_sec": r["timestamp_sec"],
            "iso_time": r["iso_time"],
            "speed_kmh": r["speed_kmh"]
        })
        for f in r["flags"]:
            trajectories[plate]["flags"].add(f)
        trajectories[plate]["latest_speed_kmh"] = r.get("speed_kmh", 0)

    # Format list
    traj_list = []
    for plate, data in trajectories.items():
        data["flags"] = list(data["flags"])
        color_code = "#10b981" # Green
        if "GHOST_ALERT" in data["flags"]:
            color_code = "#ef4444" # Red
        elif "WATCHLIST_MATCH" in data["flags"]:
            color_code = "#f43f5e" # Crimson
        elif "SPEED_VIOLATION" in data["flags"]:
            color_code = "#f59e0b" # Amber

        data["map_color"] = color_code
        data["path_coords"] = [wp["coord"] for wp in data["waypoints"]]
        traj_list.append(data)

    return {
        "center": [28.6180, 77.2050],
        "zoom": 12,
        "cameras": list(DELHI_CAMERAS.values()),
        "edges": city_engine.get_network_edges(),
        "pcr_units": PCR_UNITS,
        "active_trajectories": traj_list,
        "total_sightings": len(rows)
    }

@app.get("/api/map/geojson")
def get_map_geojson():
    """
    Returns standard RFC 7946 GeoJSON FeatureCollection containing all
    Delhi cameras (Points), directed arterial corridors (LineStrings),
    and PCR patrol units (Points).
    """
    features = []

    # 1. Camera Points
    for cam_id, meta in DELHI_CAMERAS.items():
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [meta["lon"], meta["lat"]]
            },
            "properties": {
                "id": cam_id,
                "name": meta["name"],
                "landmark": meta["landmark"],
                "zone": meta["zone"],
                "speed_limit": meta["speed_limit"],
                "feature_type": "CAMERA_NODE"
            }
        })

    # 2. Directed Edges (Corridors)
    for edge in city_engine.get_network_edges():
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [edge["from_coord"][1], edge["from_coord"][0]],
                    [edge["to_coord"][1], edge["to_coord"][0]]
                ]
            },
            "properties": {
                "from_cam": edge["from_cam"],
                "to_cam": edge["to_cam"],
                "road_name": edge["road_name"],
                "min_time_sec": edge["min_time_sec"],
                "length_km": edge["length_km"],
                "feature_type": "NETWORK_CORRIDOR"
            }
        })

    # 3. PCR Police Units
    for pcr in PCR_UNITS:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [pcr["lon"], pcr["lat"]]
            },
            "properties": {
                "id": pcr["id"],
                "callsign": pcr["callsign"],
                "station": pcr["station"],
                "officer": pcr["officer"],
                "vehicle": pcr["vehicle"],
                "feature_type": "PCR_PATROL_UNIT"
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }

@app.get("/api/map/trajectory/{plate}")
def get_vehicle_trajectory_map(plate: str):
    """
    Returns detailed trajectory map coordinates and GeoJSON for a specific vehicle plate.
    """
    plate_norm = plate.strip().upper()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.*, c.name as camera_name, c.lat, c.lon
        FROM sightings s
        JOIN cameras c ON s.camera_id = c.id
        WHERE UPPER(s.plate) = ?
        ORDER BY s.timestamp_sec ASC
    """, (plate_norm,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail=f"No sightings found for plate {plate_norm}")

    coords = [[r["lat"], r["lon"]] for r in rows]
    geojson_coords = [[r["lon"], r["lat"]] for r in rows]

    # Predict next Markov vector
    last_cam = rows[-1]["camera_id"]
    prev_cam = rows[-2]["camera_id"] if len(rows) > 1 else None
    prediction = city_engine.predict_next_trajectory(current_cam=last_cam, prev_cam=prev_cam)

    return {
        "plate": plate_norm,
        "sightings_count": len(rows),
        "vehicle_type": rows[-1].get("vehicle_type", "Sedan"),
        "color": rows[-1].get("color", "White"),
        "path_coordinates": coords,
        "geojson": {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": geojson_coords
            },
            "properties": {
                "plate": plate_norm,
                "first_seen": rows[0]["iso_time"],
                "last_seen": rows[-1]["iso_time"],
                "last_camera": rows[-1]["camera_name"]
            }
        },
        "waypoints": rows,
        "markov_prediction": prediction
    }

@app.get("/api/network-edges")
def get_network_edges():
    return {"edges": city_engine.get_network_edges()}

@app.get("/api/pcr-units")
def get_pcr_units():
    return {"units": PCR_UNITS}

@app.get("/api/sightings")
def get_sightings(limit: int = 50, plate: Optional[str] = None, camera_id: Optional[str] = None):
    conn = get_db_connection()
    cur = conn.cursor()
    query = "SELECT s.*, c.name as camera_name, c.lat, c.lon FROM sightings s JOIN cameras c ON s.camera_id = c.id"
    params = []
    conditions = []
    if plate:
        conditions.append("s.plate LIKE ?")
        params.append(f"%{plate}%")
    if camera_id:
        conditions.append("s.camera_id = ?")
        params.append(camera_id)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY s.timestamp_sec DESC LIMIT ?"
    params.append(limit)

    cur.execute(query, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    for r in rows:
        try:
            r["flags"] = json.loads(r["flags"])
        except Exception:
            r["flags"] = [r["flags"]]

    return {"sightings": rows}

@app.post("/api/sightings")
async def create_sighting(data: SightingCreate):
    # FIX BUG 8: merged duplicate /api/sighting endpoint into /api/sightings
    # Now supports optional timestamp_sec (custom_timestamp) from SightingCreate schema
    result = await process_and_record_sighting(
        plate=data.plate.strip().upper(),
        camera_id=data.camera_id,
        confidence=data.confidence,
        vehicle_type=data.vehicle_type or "Sedan",
        color=data.color or "White",
        forced_speed=data.speed_kmh,
        custom_timestamp=data.timestamp_sec  # FIX BUG 8: was missing in original /api/sightings
    )

    # Automatically persist to dedicated live streaming vehicles database
    try:
        known_models = {
            "DL 3C AW 9463": "Honda City (Sedan)",
            "DL 10C DQ 6219": "Skoda Slavia (Sedan)",
            "DL 10C MM 2608": "Mahindra Scorpio-N (SUV)",
            "DL 8C XY 4854": "Toyota Fortuner 4x4 (SUV)",
            "DL 10C AW 7311": "Hyundai Creta (SUV)",
            "AP 10 AR 0658": "Hyundai i10 (Hatchback)",
            "AP 10 AR 0558": "Hyundai i10 (Hatchback)",
            "UP 16 Z 4455": "Skoda Slavia (Sedan)",
            "DL 1C AA 9999": "Mahindra Scorpio-N (Convoy Lead)"
        }
        car_model = known_models.get(data.plate.strip().upper(), f"{data.color or 'White'} {data.vehicle_type or 'Vehicle'}")
        cam_info = DELHI_CAMERAS.get(data.camera_id, {})
        station_name = cam_info.get("name", data.camera_id)
        corridor = cam_info.get("landmark", "")
        speed_limit = float(cam_info.get("speed_limit", 50))
        speed = float(data.speed_kmh or 45.0)

        live_rec = insert_live_streaming_vehicle(
            plate=data.plate.strip().upper(),
            car_model=car_model,
            vehicle_type=data.vehicle_type or "Sedan",
            color=data.color or "White",
            speed_kmh=speed,
            speed_limit=speed_limit,
            station_id=data.camera_id,
            station_name=station_name,
            corridor=corridor,
            confidence=data.confidence or 0.98,
            detection_engine="NVIDIA NIM + Native ANPR"
        )
        await manager.broadcast({
            "type": "LIVE_STREAMING_VEHICLE_LOGGED",
            "data": live_rec
        })
    except Exception as e:
        logger.warning(f"Failed to record live streaming vehicle: {e}")

    return result

class LiveVehicleCreate(BaseModel):
    plate: str
    car_model: Optional[str] = "Vehicle"
    vehicle_type: Optional[str] = "Sedan"
    color: Optional[str] = "White"
    speed_kmh: float
    station_id: str
    station_name: Optional[str] = ""
    corridor: Optional[str] = ""
    speed_limit: Optional[float] = 50.0
    confidence: Optional[float] = 0.98
    detection_engine: Optional[str] = "NVIDIA NIM + Native ANPR"

@app.get("/api/live-vehicles")
def get_live_vehicles_endpoint(limit: int = 100, station_id: Optional[str] = None):
    vehicles = get_live_streaming_vehicles(limit=limit, station_id=station_id)
    return {
        "success": True,
        "count": len(vehicles),
        "vehicles": vehicles
    }

@app.post("/api/live-vehicles")
async def record_live_vehicle_endpoint(data: LiveVehicleCreate):
    rec = insert_live_streaming_vehicle(
        plate=data.plate,
        car_model=data.car_model or "Vehicle",
        vehicle_type=data.vehicle_type or "Sedan",
        color=data.color or "White",
        speed_kmh=data.speed_kmh,
        station_id=data.station_id,
        station_name=data.station_name or "",
        corridor=data.corridor or "",
        speed_limit=data.speed_limit or 50.0,
        confidence=data.confidence or 0.98,
        detection_engine=data.detection_engine or "NVIDIA NIM + Native ANPR"
    )
    await manager.broadcast({
        "type": "LIVE_STREAMING_VEHICLE_LOGGED",
        "data": rec
    })
    return {"success": True, "vehicle": rec}

@app.get("/api/alerts")
def get_alerts(limit: int = 30):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT a.*, c.name as camera_name, c.lat, c.lon
        FROM alerts a
        JOIN cameras c ON a.camera_id = c.id
        ORDER BY a.timestamp_sec DESC
        LIMIT ?
    """, (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    for r in rows:
        try:
            r["details"] = json.loads(r["details"])
        except Exception:
            pass

    return {"alerts": rows}

@app.get("/api/convoys")
def get_convoys():
    conn = get_db_connection()
    cur = conn.cursor()
    # Fetch recent 200 sightings for convoy analysis
    cur.execute("""
        SELECT plate, camera_id, timestamp_sec
        FROM sightings
        ORDER BY timestamp_sec DESC
        LIMIT 250
    """)
    sightings = [dict(r) for r in cur.fetchall()]
    conn.close()

    convoys = city_engine.detect_convoys(sightings)
    return {"convoys": convoys}

@app.get("/api/watchlist")
def get_watchlist():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM watchlist ORDER BY severity DESC, added_at DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"watchlist": rows}

@app.post("/api/watchlist")
async def add_to_watchlist(data: WatchlistCreate):
    plate_norm = data.plate.strip().upper()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO watchlist (plate, reason, severity, added_at, description, status)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
        ON CONFLICT(plate) DO UPDATE SET
            reason=excluded.reason,
            severity=excluded.severity,
            description=excluded.description,
            status='ACTIVE'
    """, (plate_norm, data.reason, data.severity, datetime.now().isoformat(), data.description or "Citizen Report"))
    conn.commit()
    conn.close()

    await manager.broadcast({
        "type": "WATCHLIST_UPDATED",
        "plate": plate_norm,
        "reason": data.reason,
        "severity": data.severity
    })

    return {"success": True, "message": f"Plate {plate_norm} successfully enrolled in active watchlist."}

@app.post("/api/alibi")
def verify_alibi(payload: AlibiRequest):
    plate_norm = payload.plate.strip().upper()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT camera_id, timestamp_sec, speed_kmh
        FROM sightings
        WHERE plate = ?
        ORDER BY timestamp_sec DESC
    """, (plate_norm,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    claimed_time = payload.claimed_time_sec if payload.claimed_time_sec else time.time()
    result = city_engine.check_alibi(
        plate=plate_norm,
        claimed_lat=payload.claimed_lat,
        claimed_lon=payload.claimed_lon,
        claimed_time_sec=claimed_time,
        plate_sightings=rows
    )
    return result

@app.post("/api/nl-query")
async def nl_to_sql_endpoint(payload: NLQueryRequest):
    result = await execute_nl_to_sql(payload.query)
    return result

# --- One-Click Demo Triggers ---

@app.post("/api/simulate/tick")
async def simulate_live_traffic_tick():
    """Generates authentic Delhi NCR traffic sightings with real vehicle makes and RTO series."""
    cam_keys = list(DELHI_CAMERAS.keys())
    sample_vehicles = [
        ("DL 1C AA 9999", "Mahindra Scorpio-N (SUV)", "White"),
        ("HR 26 DQ 8888", "Toyota Fortuner 4x4 (SUV)", "Black"),
        ("DL 3C AW 5123", "Hyundai Creta SX (SUV)", "Dark Grey"),
        ("DL 8C AB 9110", "Honda City ZX (Sedan)", "Silver"),
        ("DL 9C AB 1234", "Maruti Suzuki Swift (Hatchback)", "Red"),
        ("DL 1C BB 9444", "Tata Safari Dark Edition (SUV)", "Black"),
        ("HR 26 CU 8219", "Tata Nexon EV (SUV)", "Teal Blue"),
        ("UP 16 DX 3012", "Skoda Slavia (Sedan)", "Blue"),
        ("DL 8C JK 4912", "Hyundai Verna Turbo (Sedan)", "Dark Grey"),
        ("DL 6C KL 6600", "Delhi Green Auto (Bajaj RE)", "Yellow-Green"),
        ("DL 7C MN 7700", "DTC Electric AC Bus", "Blue"),
        ("UP 14 DX 1234", "Mahindra Scorpio-N (SUV)", "Black"),
        ("UP 16 Z 4455", "Skoda Slavia (Sedan)", "Silver"),
        ("DL 1C WX 0007", "Toyota Fortuner 4x4 (SUV)", "Dark Grey"),
        ("DL 2C RT 1109", "Mahindra Thar 4x4 (SUV)", "Black"),
        ("DL 4C XY 9081", "Kia Seltos GT-Line (SUV)", "White"),
    ]
    p_info = random.choice(sample_vehicles)
    target_cam = random.choice(cam_keys)
    confidence = round(random.uniform(0.91, 0.99), 2)
    speed = round(random.uniform(42.0, 78.0), 1)

    res = await process_and_record_sighting(
        plate=p_info[0],
        camera_id=target_cam,
        confidence=confidence,
        vehicle_type=p_info[1],
        color=p_info[2],
        forced_speed=speed
    )
    return {"tick_result": res}

@app.post("/api/simulate/hit-and-run")
async def trigger_hit_and_run():
    """
    Simulates Hit-and-Run suspect DL 1C WX 0007 spotted fleeing through ITO Junction (CAM_03)
    towards Sarai Kale Khan (CAM_12) at excessive velocity, generating instant Watchlist Hit
    and dispatching nearest PCR interceptor.
    """
    plate = "DL 1C WX 0007"
    cam_id = "CAM_03" # ITO Junction
    speed = 88.5 # speeding flight velocity

    res = await process_and_record_sighting(
        plate=plate,
        camera_id=cam_id,
        confidence=0.98,
        vehicle_type="SUV",
        color="Dark Grey",
        forced_speed=speed
    )
    return {
        "scenario": "HIT_AND_RUN_EMERGENCY",
        "plate": plate,
        "camera": DELHI_CAMERAS[cam_id]["name"],
        "result": res
    }

@app.post("/api/simulate/ghost-plate")
async def trigger_ghost_plate():
    """
    Simulates Ghost Plate cloned registration anomaly:
    Plate DL 8C AB 9110 is spotted at CAM_01 (Connaught Place),
    and then 12 seconds later spotted at CAM_07 (IGI Airport) — 15 km away!
    This triggers a critical GHOST_ALERT via Dijkstra minimum travel time violation.
    """
    plate = "DL 8C AB 9110"
    now_t = time.time()

    # Sighting 1 at Connaught Place
    await process_and_record_sighting(
        plate=plate,
        camera_id="CAM_01",
        confidence=0.96,
        vehicle_type="Sedan",
        color="Silver",
        custom_timestamp=now_t - 15
    )

    # Sighting 2 at IGI Airport (15 km away in 15 seconds! Physical impossibility)
    res2 = await process_and_record_sighting(
        plate=plate,
        camera_id="CAM_07",
        confidence=0.97,
        vehicle_type="Sedan",
        color="White",
        custom_timestamp=now_t
    )

    return {
        "scenario": "GHOST_PLATE_CLONE_DETECTED",
        "plate": plate,
        "explanation": "Plate spotted at Connaught Place and IGI Airport concurrently within 15 seconds.",
        "result": res2
    }

@app.post("/api/vision/analyze")
async def analyze_photo_endpoint(
    file: UploadFile = File(...)
):
    """
    Dedicated AI Vision endpoint:
    Automatically identifies vehicle color, license plate, and make/model from uploaded image.
    Always returns valid JSON even if parsing or reading fails.
    """
    try:
        image_bytes = await file.read()
        if not image_bytes or len(image_bytes) == 0:
            return {
                "success": False,
                "error": "Empty image payload received",
                "filename": file.filename or "unknown.jpg",
                "analysis": None
            }
        analysis = await analyze_vehicle_photo(image_bytes, file.filename or "uploaded_car.jpg")
        return {
            "success": True,
            "filename": file.filename,
            "analysis": analysis
        }
    except Exception as e:
        logger.error(f"Vision analysis endpoint failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "filename": getattr(file, "filename", "unknown.jpg"),
            "analysis": None
        }

@app.post("/api/simulate/upload-dashcam")
async def upload_dashcam_frame(
    file: Optional[UploadFile] = File(None),
    camera_id: str = Form("CAM_02"),
    mock_plate: Optional[str] = Form(None),
    override_color: Optional[str] = Form(None),
    override_vehicle: Optional[str] = Form(None)
):
    """
    ANPR OCR Vision Ingestion:
    Automatically identifies vehicle color, plate, and make/model from uploaded photo/dashcam frame,
    and pushes live sighting into the municipal surveillance network.
    """
    detected_plate = mock_plate.strip().upper() if mock_plate and mock_plate.strip() else None
    detected_color = override_color or "White"
    detected_vehicle = override_vehicle or "SUV"
    confidence = 0.95
    analysis_meta = {}

    if file:
        image_bytes = await file.read()
        if len(image_bytes) > 0:
            analysis = await analyze_vehicle_photo(image_bytes, file.filename or "dashcam.jpg")
            analysis_meta = analysis
            if not detected_plate:
                detected_plate = analysis.get("plate", "DL 1C WX 0007")
            detected_color = analysis.get("color", detected_color)
            detected_vehicle = f"{analysis.get('make_model', 'SUV')} ({analysis.get('vehicle_type', 'SUV')})"
            confidence = analysis.get("confidence", 0.95)

    if not detected_plate:
        detected_plate = "DL 1C WX 0007"

    res = await process_and_record_sighting(
        plate=detected_plate,
        camera_id=camera_id if camera_id in DELHI_CAMERAS else "CAM_02",
        confidence=confidence,
        vehicle_type=detected_vehicle,
        color=detected_color,
        forced_speed=68.5
    )

    return {
        "filename": file.filename if file else "synthetic_dashcam_capture.jpg",
        "ocr_extracted_plate": detected_plate,
        "detected_color": detected_color,
        "detected_vehicle": detected_vehicle,
        "confidence": confidence,
        "camera_tagged": DELHI_CAMERAS.get(camera_id, {}).get("name", "India Gate"),
        "analysis_meta": analysis_meta,
        "result": res
    }

class MapConfigRequest(BaseModel):
    provider: Optional[str] = "GOOGLE_DARK"
    api_key: Optional[str] = ""

@app.get("/api/config/map")
def get_map_config():
    try:
        from backend.llm_client import load_keys
    except ImportError:
        from llm_client import load_keys
    load_keys()
    provider = os.environ.get("MAP_PROVIDER", "GOOGLE_DARK").upper()
    api_key = (
        os.environ.get("MAP_API_KEY") or
        os.environ.get("GOOGLE_MAPS_API_KEY") or
        os.environ.get("MAPBOX_ACCESS_TOKEN") or
        os.environ.get("MAPTILER_API_KEY") or
        os.environ.get("STADIA_API_KEY") or ""
    )
    return {
        "provider": provider,
        "has_key": bool(api_key),
        "api_key_masked": f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else ("***" if api_key else ""),
        "providers_supported": ["GOOGLE_DARK", "GOOGLE_HYBRID", "GOOGLE_ROADMAP", "GOOGLE_TERRAIN", "OSM", "MAPBOX", "MAPTILER", "STADIA", "CARTO"]
    }

@app.post("/api/config/map")
def update_map_config(cfg: MapConfigRequest):
    provider = (cfg.provider or "GOOGLE_DARK").upper()
    key = cfg.api_key.strip() if cfg.api_key else ""
    os.environ["MAP_PROVIDER"] = provider
    os.environ["MAP_API_KEY"] = key
    if provider.startswith("GOOGLE"):
        os.environ["GOOGLE_MAPS_API_KEY"] = key
    elif provider == "MAPBOX":
        os.environ["MAPBOX_ACCESS_TOKEN"] = key
    elif provider == "MAPTILER":
        os.environ["MAPTILER_API_KEY"] = key
    elif provider == "STADIA":
        os.environ["STADIA_API_KEY"] = key

    # Persist to .env
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    try:
        lines = []
        if os.path.exists(env_file):
            with open(env_file, "r") as f:
                lines = f.readlines()
        
        updated = False
        new_lines = []
        for line in lines:
            if line.startswith("MAP_PROVIDER="):
                new_lines.append(f"MAP_PROVIDER={provider}\n")
                updated = True
            elif line.startswith("MAP_API_KEY="):
                new_lines.append(f"MAP_API_KEY={key}\n")
                updated = True
            elif provider == "MAPBOX" and line.startswith("MAPBOX_ACCESS_TOKEN="):
                new_lines.append(f"MAPBOX_ACCESS_TOKEN={key}\n")
            elif provider == "MAPTILER" and line.startswith("MAPTILER_API_KEY="):
                new_lines.append(f"MAPTILER_API_KEY={key}\n")
            elif provider == "STADIA" and line.startswith("STADIA_API_KEY="):
                new_lines.append(f"STADIA_API_KEY={key}\n")
            else:
                new_lines.append(line)
        if not updated:
            new_lines.append(f"\nMAP_PROVIDER={provider}\nMAP_API_KEY={key}\n")
        with open(env_file, "w") as f:
            f.writelines(new_lines)
    except Exception as e:
        pass

    return {
        "status": "success",
        "provider": provider,
        "has_key": bool(key)
    }

# ==========================================
# CCTV & Multi-Junction RTSP Simulator APIs
# ==========================================

@app.get("/api/cctv/streams")
def get_cctv_streams():
    """
    Returns active CCTV stream endpoints across the 12 Delhi municipal corridors,
    including RTSP URLs, codec profiles, and live status.
    """
    return {
        "status": "success",
        "streams": get_all_camera_streams(),
        "simulator": stream_worker.get_status()
    }

@app.get("/api/cctv/streams/{cam_id}/rtsp-command")
def get_stream_rtsp_command(cam_id: str):
    """
    Returns the exact FFmpeg command string to publish this video stream
    over an RTSP transport channel (e.g. for MediaMTX, VLC, or OpenCV).
    """
    cmd = get_ffmpeg_rtsp_command(cam_id, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if not cmd:
        raise HTTPException(status_code=404, detail=f"Camera stream {cam_id} not found")
    return {
        "camera_id": cam_id,
        "ffmpeg_command": cmd,
        "stream_info": CAMERA_STREAM_PROFILES.get(cam_id)
    }

class SimulatorToggleRequest(BaseModel):
    enabled: bool

@app.post("/api/cctv/simulator/toggle")
async def toggle_cctv_simulator(req: SimulatorToggleRequest):
    """
    Enable or pause background automated vehicle stream ingestion across corridors.
    """
    if req.enabled:
        await stream_worker.start(process_and_record_sighting)
    else:
        await stream_worker.stop()
    return {
        "success": True,
        "status": stream_worker.get_status()
    }

@app.post("/api/cctv/simulator/trigger-scan")
async def trigger_cctv_optical_scan():
    """
    Trigger an instant optical ANPR OCR scan across active CCTV junction feeds.
    """
    scan_result = await stream_worker.execute_scan_cycle(process_and_record_sighting)
    return {
        "success": True,
        "data": scan_result
    }

@app.get("/api/cctv/simulator/status")
def get_simulator_status_endpoint():
    return {
        "success": True,
        "status": stream_worker.get_status()
    }

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial state snapshot
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM alerts ORDER BY timestamp_sec DESC LIMIT 10")
        recent_alerts = [dict(r) for r in cur.fetchall()]
        for a in recent_alerts:
            try:
                a["details"] = json.loads(a["details"])
            except Exception:
                pass

        cur.execute("SELECT s.*, c.name as camera_name, c.lat, c.lon FROM sightings s JOIN cameras c ON s.camera_id = c.id ORDER BY s.timestamp_sec DESC LIMIT 20")
        recent_sightings = [dict(r) for r in cur.fetchall()]
        for s in recent_sightings:
            try:
                s["flags"] = json.loads(s["flags"])
            except Exception:
                s["flags"] = [s["flags"]]
        conn.close()

        await websocket.send_json({
            "type": "INIT_STATE",
            "cameras": list(DELHI_CAMERAS.values()),
            "recent_sightings": recent_sightings,
            "recent_alerts": recent_alerts
        })

        while True:
            # Keep connection alive, listen for ping/client requests
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "PING":
                    await websocket.send_json({"type": "PONG"})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# Static files and frontend SPA routing
dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(dist_path):
    # Mount subdirectories explicitly for root assets (JS chunks, CSS, images, footage)
    for sub in ["assets", "mockup_assets", "sample_cars", "footage"]:
        p = os.path.join(dist_path, sub)
        if os.path.exists(p):
            app.mount(f"/{sub}", StaticFiles(directory=p), name=sub)

    # Legacy /app mount compatibility
    app.mount("/app", StaticFiles(directory=dist_path, html=True), name="static")

    # Root single-page application mount (placed last after all /api/* routes)
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="frontend")

