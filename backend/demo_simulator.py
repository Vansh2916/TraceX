"""
Deterministic Scenario Generator for Hackathon Live Demonstrations.
Simulates realistic vehicle corridors, speeders, and convoy groups.
"""
from typing import List, Dict, Any
import time

def generate_ghost_vehicle_scenario() -> List[Dict[str, Any]]:
    """Generates sightings for a cloned plate detected at two distant junctions simultaneously."""
    now = time.time()
    return [
        {
            "plate_number": "DL01GH0571",
            "camera_id": "CAM_01",
            "camera_name": "Connaught Place",
            "timestamp_sec": now,
            "anomaly": "CLONED_PLATE_GHOST",
            "confidence": 0.98,
        },
        {
            "plate_number": "DL01GH0571",
            "camera_id": "CAM_12",
            "camera_name": "Ashram Chowk",
            "timestamp_sec": now + 15.0,  # 15 seconds later across 12 km!
            "anomaly": "PHYSICALLY_IMPOSSIBLE_SPEED",
            "calculated_speed_kmh": 2880.0,
            "confidence": 0.99,
        },
    ]

def generate_convoy_scenario() -> List[Dict[str, Any]]:
    """Generates tightly correlated sightings for 3 vehicles traveling in tandem."""
    now = time.time()
    vehicles = ["DL03CC0456", "HR26DK9723", "UP16BT4097"]
    junctions = [("CAM_01", 0), ("CAM_02", 120), ("CAM_03", 240)]
    
    events = []
    for cam_id, delay in junctions:
        for offset, plate in enumerate(vehicles):
            events.append({
                "plate_number": plate,
                "camera_id": cam_id,
                "timestamp_sec": now + delay + (offset * 3),
                "flag": "CONVOY_SUSPECT",
            })
    return events
