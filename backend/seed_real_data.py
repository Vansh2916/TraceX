import os
import json
import time
import random
from datetime import datetime, timedelta
import sqlite3
from backend.engine import DELHI_CAMERAS, PCR_UNITS

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "crusaders.db")

# Real Delhi NCR Vehicle Models and Real Registration Patterns
REAL_VEHICLES = [
    # SUVs
    {"make_model": "Mahindra Scorpio-N", "type": "SUV", "colors": ["White", "Black", "Dark Grey"]},
    {"make_model": "Toyota Fortuner 4x4", "type": "SUV", "colors": ["White", "Black", "Silver"]},
    {"make_model": "Hyundai Creta SX", "type": "SUV", "colors": ["White", "Dark Grey", "Black"]},
    {"make_model": "Tata Safari Dark Edition", "type": "SUV", "colors": ["Black", "Dark Grey"]},
    {"make_model": "Tata Nexon EV", "type": "SUV", "colors": ["Teal Blue", "White", "Dark Grey"]},
    {"make_model": "Mahindra Thar 4x4", "type": "SUV", "colors": ["Black", "Red", "Grey"]},
    {"make_model": "Kia Seltos GT-Line", "type": "SUV", "colors": ["Silver", "White", "Blue"]},
    
    # Sedans
    {"make_model": "Honda City ZX", "type": "Sedan", "colors": ["Silver", "White", "Grey"]},
    {"make_model": "Hyundai Verna Turbo", "type": "Sedan", "colors": ["White", "Black", "Red"]},
    {"make_model": "Skoda Slavia", "type": "Sedan", "colors": ["Silver", "Dark Red", "Blue"]},
    {"make_model": "Maruti Suzuki Dzire", "type": "Sedan", "colors": ["White", "Silver", "Grey"]},
    
    # Hatchbacks
    {"make_model": "Maruti Suzuki Swift", "type": "Hatchback", "colors": ["Red", "White", "Silver"]},
    {"make_model": "Hyundai i20 Asta", "type": "Hatchback", "colors": ["Grey", "White", "Red"]},
    {"make_model": "Tata Altroz", "type": "Hatchback", "colors": ["Gold", "Grey", "White"]},
    
    # Commercial & Transit
    {"make_model": "DTC Electric AC Bus", "type": "Bus", "colors": ["Blue", "Orange"]},
    {"make_model": "Delhi Green Auto (Bajaj RE)", "type": "Auto-Rickshaw", "colors": ["Yellow-Green"]},
    {"make_model": "Tata Ace Mega", "type": "Truck", "colors": ["White", "Silver"]},
    {"make_model": "Royal Enfield Classic 350", "type": "Motorcycle", "colors": ["Black", "Gunmetal Grey"]},
]

REAL_WATCHLIST = [
    {
        "plate": "DL 1C WX 0007",
        "reason": "Hit-and-Run Fatal Pedestrian Collision (FIR 182/26 Tilak Marg PS)",
        "severity": "CRITICAL",
        "desc": "Dark Grey Toyota Fortuner 4x4 involved in high-speed hit-and-run near India Gate C-Hexagon. Driver fled towards ITO."
    },
    {
        "plate": "DL 8C AB 9110",
        "reason": "Duplicate / Cloned HSRP License Plate (Section 420/468 IPC)",
        "severity": "CRITICAL",
        "desc": "Silver Honda City spotted simultaneously at Connaught Place and IGI Airport T3. Physical impossibility flags cloned registration."
    },
    {
        "plate": "UP 14 DX 1234",
        "reason": "Armed Carjacking & Robbery (FIR 412/26 Sector 18 Border)",
        "severity": "HIGH",
        "desc": "Stolen Black Mahindra Scorpio-N. Armed occupants suspected of carrying illegal firearms moving along Vikas Marg."
    },
    {
        "plate": "HR 51 BZ 4321",
        "reason": "Inter-State Commercial Narcotics Transit",
        "severity": "HIGH",
        "desc": "White Hyundai Creta suspected courier vehicle operating between Gurugram CyberCity and Delhi Ring Road."
    },
    {
        "plate": "DL 1C AA 9999",
        "reason": "Unpermitted VIP Tactical Convoy Lead Formation",
        "severity": "MEDIUM",
        "desc": "White Scorpio-N leading armed security escort convoy without Delhi Police transit clearance."
    }
]

def seed_real_delhi_surveillance():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    # Clear old data for pristine presentation
    cur.execute("DELETE FROM sightings")
    cur.execute("DELETE FROM alerts")
    cur.execute("DELETE FROM watchlist")
    cur.execute("DELETE FROM cameras")

    # 1. Seed Real Delhi Cameras
    for cam_id, meta in DELHI_CAMERAS.items():
        cur.execute("""
            INSERT INTO cameras (id, name, landmark, lat, lon, zone, speed_limit)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (cam_id, meta["name"], meta["landmark"], meta["lat"], meta["lon"], meta["zone"], meta["speed_limit"]))

    # 2. Seed Real Watchlist
    now_iso = datetime.now().isoformat()
    for w in REAL_WATCHLIST:
        cur.execute("""
            INSERT INTO watchlist (plate, reason, severity, added_at, description, status)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE')
        """, (w["plate"], w["reason"], w["severity"], now_iso, w["desc"]))

    # 3. Seed Realistic Multi-Junction Vehicular Sightings
    now_sec = time.time()
    all_sightings = []

    # Corridor 1: Cloned / Ghost Plate Demonstration
    # 'DL 8C AB 9110' at CAM_01 (CP) and CAM_07 (IGI Airport) within 15 seconds!
    t_ghost = now_sec - 120
    all_sightings.append((
        "DL 8C AB 9110", "CAM_01", t_ghost - 15,
        datetime.fromtimestamp(t_ghost - 15).isoformat(),
        48.2, 0.98, "Sedan", "Silver", json.dumps(["NORMAL"])
    ))
    all_sightings.append((
        "DL 8C AB 9110", "CAM_07", t_ghost,
        datetime.fromtimestamp(t_ghost).isoformat(),
        52.4, 0.97, "Sedan", "Silver", json.dumps(["GHOST_ALERT", "WATCHLIST_MATCH"])
    ))

    # Corridor 2: Convoy Formation along Ring Road
    # Plate 1: DL 1C AA 9999 (White Scorpio-N)
    # Plate 2: HR 26 DQ 8888 (Black Fortuner)
    convoy_junctions = [
        ("CAM_07", now_sec - 900), # Airport T3
        ("CAM_06", now_sec - 650), # Dhaula Kuan
        ("CAM_09", now_sec - 480), # Moti Bagh
        ("CAM_05", now_sec - 310), # AIIMS
        ("CAM_10", now_sec - 150), # Lajpat Nagar
    ]
    for cid, t in convoy_junctions:
        # Lead car
        all_sightings.append((
            "DL 1C AA 9999", cid, t, datetime.fromtimestamp(t).isoformat(),
            62.5, 0.97, "SUV", "White", json.dumps(["NORMAL", "CONVOY_CANDIDATE"])
        ))
        # Escort car trailing 15-22 seconds
        t_escort = t + 18
        all_sightings.append((
            "HR 26 DQ 8888", cid, t_escort, datetime.fromtimestamp(t_escort).isoformat(),
            64.0, 0.95, "SUV", "Black", json.dumps(["NORMAL", "CONVOY_CANDIDATE"])
        ))

    # Corridor 3: Speeding Violator on NH-48
    t_speed = now_sec - 420
    all_sightings.append((
        "UP 16 Z 4455", "CAM_06", t_speed,
        datetime.fromtimestamp(t_speed).isoformat(),
        94.2, 0.96, "Sedan", "Silver", json.dumps(["SPEED_VIOLATION"])
    ))

    # Corridor 4: Wanted Stolen Black SUV (Hit and Run Suspect)
    t_wanted = now_sec - 240
    all_sightings.append((
        "UP 14 DX 1234", "CAM_03", t_wanted,
        datetime.fromtimestamp(t_wanted).isoformat(),
        68.5, 0.98, "SUV", "Black", json.dumps(["WATCHLIST_MATCH"])
    ))

    # Corridor 5: 15 Real Ambient Multi-Junction Trajectories
    camera_ids = list(DELHI_CAMERAS.keys())
    
    ambient_plates = [
        ("DL 1C AB 1100", "SUV", "White"),
        ("DL 2C CD 2200", "Sedan", "Dark Grey"),
        ("DL 3C EF 3300", "Hatchback", "Red"),
        ("DL 4C GH 4400", "SUV", "Black"),
        ("DL 5C IJ 5500", "Sedan", "Silver"),
        ("DL 6C KL 6600", "Auto-Rickshaw", "Yellow-Green"),
        ("DL 7C MN 7700", "Bus", "Blue"),
        ("DL 8C OP 8800", "Motorcycle", "Black"),
        ("DL 9C QR 9900", "SUV", "White"),
        ("DL 10C ST 1010", "Sedan", "Grey"),
        ("HR 26 AK 1122", "SUV", "Silver"),
        ("HR 26 BZ 3344", "Sedan", "White"),
        ("HR 51 CD 5566", "Hatchback", "Blue"),
        ("UP 16 EF 7788", "SUV", "Dark Grey"),
        ("UP 14 GH 9900", "Sedan", "Black"),
        ("DL 1C WX 0007", "SUV", "Dark Grey"),
        ("HR 51 BZ 4321", "SUV", "White"),
        ("DL 3C CC 1122", "SUV", "Black"),
        ("DL 9C AB 1234", "Hatchback", "Red"),
        ("DL 4C XY 9081", "Sedan", "White"),
    ]

    # Generate multi-stop trips for each ambient car over the last 90 minutes
    for plate, vtype, color in ambient_plates:
        # 3 to 5 camera hops per vehicle along logical routes
        num_hops = random.randint(3, 5)
        start_cam_idx = random.randint(0, len(camera_ids) - 1)
        trip_start_t = now_sec - random.randint(300, 5400)
        
        curr_t = trip_start_t
        for hop in range(num_hops):
            cam = camera_ids[(start_cam_idx + hop) % len(camera_ids)]
            speed = round(random.uniform(42.0, 72.0), 1)
            conf = round(random.uniform(0.91, 0.99), 2)
            flags = ["NORMAL"]
            if speed > 80:
                flags = ["SPEED_VIOLATION"]
            
            all_sightings.append((
                plate, cam, curr_t, datetime.fromtimestamp(curr_t).isoformat(),
                speed, conf, vtype, color, json.dumps(flags)
            ))
            # Next camera traversal in 3 to 8 minutes
            curr_t += random.randint(180, 480)

    # Insert all sightings
    cur.executemany("""
        INSERT INTO sightings (plate, camera_id, timestamp_sec, iso_time, speed_kmh, confidence, vehicle_type, color, flags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, all_sightings)

    # 4. Seed Real Ground-Truth Alerts
    real_alerts = [
        (
            "GHOST_ALERT", "DL 8C AB 9110", "CAM_07", t_ghost,
            datetime.fromtimestamp(t_ghost).isoformat(), "CRITICAL",
            json.dumps({
                "plate": "DL 8C AB 9110",
                "reason": "Duplicate / Cloned HSRP License Plate Detected",
                "prev_camera": "CAM_01 (Connaught Place)",
                "curr_camera": "CAM_07 (IGI Airport T3)",
                "elapsed_sec": 15,
                "dijkstra_min_sec": 850,
                "distance_km": 14.5,
                "required_velocity_kmh": 3480.0,
                "message": "Vehicle teleported across Delhi in 15 seconds. Physical traversal threshold violated. Cloned plate confirmed."
            })
        ),
        (
            "CONVOY_DETECTED", "DL 1C AA 9999", "CAM_10", now_sec - 150,
            datetime.fromtimestamp(now_sec - 150).isoformat(), "HIGH",
            json.dumps({
                "plates": ["DL 1C AA 9999", "HR 26 DQ 8888"],
                "vehicles": ["White Mahindra Scorpio-N", "Black Toyota Fortuner 4x4"],
                "co_occurrence_count": 5,
                "cameras": ["CAM_07", "CAM_06", "CAM_09", "CAM_05", "CAM_10"],
                "message": "Tactical 2-vehicle convoy moving in synchronized 18-second formation across 5 Ring Road corridors."
            })
        ),
        (
            "WATCHLIST_HIT", "UP 14 DX 1234", "CAM_03", t_wanted,
            datetime.fromtimestamp(t_wanted).isoformat(), "HIGH",
            json.dumps({
                "plate": "UP 14 DX 1234",
                "reason": "Armed Carjacking & Robbery (FIR 412/26)",
                "vehicle": "Black Mahindra Scorpio-N",
                "camera_name": "ITO Junction",
                "speed_kmh": 68.5,
                "message": "Flagged armed carjacking suspect spotted heading towards India Gate C-Hexagon.",
                "pcr_dispatch": {
                    "nearest_pcr": PCR_UNITS[1], # Sher-2
                    "eta_seconds": 120,
                    "target_next_camera": "CAM_02 (India Gate C-Hexagon)"
                }
            })
        ),
        (
            "SPEED_VIOLATION", "UP 16 Z 4455", "CAM_06", t_speed,
            datetime.fromtimestamp(t_speed).isoformat(), "MEDIUM",
            json.dumps({
                "plate": "UP 16 Z 4455",
                "vehicle": "Silver Skoda Slavia",
                "speed_kmh": 94.2,
                "limit_kmh": 70,
                "camera_name": "Dhaula Kuan Interchange",
                "message": "Speed radar clocked vehicle at 94.2 km/h on NH-48 airport corridor."
            })
        )
    ]

    for a in real_alerts:
        cur.execute("""
            INSERT INTO alerts (alert_type, plate, camera_id, timestamp_sec, iso_time, severity, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'UNRESOLVED')
        """, a)

    conn.commit()
    conn.close()
    print(f"[Crusaders DB] Successfully seeded {len(all_sightings)} real Delhi ANPR telemetry records and {len(real_alerts)} alerts.")

if __name__ == "__main__":
    seed_real_delhi_surveillance()
