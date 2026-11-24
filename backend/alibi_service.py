"""
authoritative, evidence-backed Alibi Verification Engine.
Strictly calculates travel-time feasibility based on registered cameras, road-network assumptions,
and cites the exact sighting IDs used. Never claims legal proof or definitive alibi.
"""
import re
import math
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

try:
    from backend.camera_registry import camera_registry
    from backend.engine import haversine_km, city_engine
except ImportError:
    from camera_registry import camera_registry
    from engine import haversine_km, city_engine

class AlibiVerificationPayload(BaseModel):
    plate: str = Field(..., min_length=3, max_length=16, description="Vehicle registration plate")
    claimed_lat: float = Field(..., ge=-90.0, le=90.0)
    claimed_lon: float = Field(..., ge=-180.0, le=180.0)
    claimed_time_sec: Optional[float] = Field(default=None)
    time_window_minutes: Optional[int] = Field(default=120, ge=1, le=1440)

def normalize_plate(plate: str) -> str:
    return re.sub(r'[^A-Z0-9]', '', plate.strip().upper())

def evaluate_alibi_evidence(
    plate: str,
    claimed_lat: float,
    claimed_lon: float,
    claimed_time_sec: float,
    sighting_records: List[Dict[str, Any]],
    time_window_minutes: int = 120
) -> Dict[str, Any]:
    """
    Evaluates vehicle alibi against exact ANPR sightings.
    Returns:
    - CONSISTENT: Available evidence does not contradict the claimed movement.
    - INCONSISTENT: Recorded evidence contradicts the claimed movement.
    - INSUFFICIENT EVIDENCE: Available records are insufficient to establish either conclusion.
    """
    norm_req = normalize_plate(plate)
    # 1. Filter only exact plate matches within search time window
    window_sec = time_window_minutes * 60
    matching_sightings = []
    for s in sighting_records:
        if normalize_plate(s.get("plate", "")) == norm_req:
            t_sec = s.get("timestamp_sec")
            if t_sec and abs(t_sec - claimed_time_sec) <= window_sec:
                matching_sightings.append(s)

    # Disclaimer that output is purely mathematical calculation, not legal proof
    legal_disclaimer = (
        "Illustrative travel-time calculation only. Consistent status indicates available "
        "evidence does not contradict claimed movement, but does not certify presence or absence "
        "elsewhere, nor does it constitute legal or court proof."
    )

    if not matching_sightings:
        return {
            "requested_plate": plate,
            "normalized_plate": norm_req,
            "outcome": "INSUFFICIENT EVIDENCE",
            "confidence_status": "UNVERIFIED",
            "claimed_coordinates": [claimed_lat, claimed_lon],
            "claimed_time_sec": claimed_time_sec,
            "claimed_time_iso": datetime.fromtimestamp(claimed_time_sec).isoformat(),
            "time_window_minutes": time_window_minutes,
            "matching_sightings_count": 0,
            "cited_sighting_ids": [],
            "evidence_timeline": [],
            "discrepancy_km": 0.0,
            "calculated_travel_interval_sec": 0,
            "required_speed_kmh": 0.0,
            "explanation": f"Insufficient surveillance data: No exact ANPR sightings found for registration '{plate}' within +/- {time_window_minutes} minutes of claimed time.",
            "disclaimer": legal_disclaimer
        }

    # Find the sighting chronologically closest to the claimed time
    closest_s = min(matching_sightings, key=lambda s: abs(s["timestamp_sec"] - claimed_time_sec))
    cited_id = closest_s.get("id")
    cam_id = closest_s.get("camera_id")
    time_delta_sec = abs(closest_s["timestamp_sec"] - claimed_time_sec)
    
    cam_obj = camera_registry.get(cam_id)
    if cam_obj:
        cam_lat, cam_lon = cam_obj.lat, cam_obj.lon
        cam_name = cam_obj.name
        cam_speed_limit = cam_obj.speed_limit
    else:
        cam_lat = closest_s.get("lat", claimed_lat)
        cam_lon = closest_s.get("lon", claimed_lon)
        cam_name = closest_s.get("camera_name", cam_id)
        cam_speed_limit = 60.0

    # Calculate spatial discrepancy
    discrepancy_km = haversine_km(claimed_lat, claimed_lon, cam_lat, cam_lon)

    # Road network assumption: maximum physical arterial corridor transit speed in Delhi NCR ~ 120 km/h
    # Required transit speed to travel discrepancy_km in time_delta_sec:
    if time_delta_sec > 10:
        required_speed_kmh = discrepancy_km / (time_delta_sec / 3600.0)
    else:
        required_speed_kmh = 9999.0 if discrepancy_km > 0.3 else 0.0

    # Feasibility check
    # If vehicle was spotted 5 km away just 60 seconds ago -> Physically impossible -> INCONSISTENT
    # If required speed exceeds max arterial corridor transit assumption (110 km/h) or discrepancy > 2.5km within 5 min
    is_inconsistent = False
    if time_delta_sec < 300 and discrepancy_km > 2.5:
        is_inconsistent = True
    elif required_speed_kmh > 110.0:
        is_inconsistent = True

    outcome = "INCONSISTENT" if is_inconsistent else "CONSISTENT"

    # Build evidence timeline citing exact sightings
    evidence_timeline = []
    for s in sorted(matching_sightings, key=lambda x: x["timestamp_sec"]):
        c_id = s.get("camera_id")
        c_meta = camera_registry.get(c_id)
        c_name = c_meta.name if c_meta else s.get("camera_name", c_id)
        evidence_timeline.append({
            "sighting_id": s.get("id"),
            "camera_id": c_id,
            "camera_name": c_name,
            "timestamp_sec": s.get("timestamp_sec"),
            "iso_time": s.get("iso_time", datetime.fromtimestamp(s.get("timestamp_sec", 0)).isoformat()),
            "speed_kmh": s.get("speed_kmh", 0.0),
            "delta_from_claimed_sec": round(s.get("timestamp_sec", 0) - claimed_time_sec, 1)
        })

    if outcome == "INCONSISTENT":
        explanation = (
            f"Physical transit impossibility: Sighting #{cited_id} recorded vehicle at camera {cam_id} ({cam_name}) "
            f"at timestamp {int(closest_s['timestamp_sec'])}, which is {time_delta_sec:.0f}s from the claimed time. "
            f"Covering the {discrepancy_km:.2f} km spatial discrepancy requires an impossible velocity of "
            f"{min(required_speed_kmh, 999.0):.1f} km/h, contradicting the claimed movement."
        )
    else:
        explanation = (
            f"Corridor transit feasible: Sighting #{cited_id} recorded vehicle at camera {cam_id} ({cam_name}) "
            f"with a spatial discrepancy of {discrepancy_km:.2f} km over a {time_delta_sec:.0f}s time interval "
            f"(required velocity: {required_speed_kmh:.1f} km/h). Available records do not contradict claimed movement."
        )

    return {
        "requested_plate": plate,
        "normalized_plate": norm_req,
        "outcome": outcome,
        "claimed_coordinates": [claimed_lat, claimed_lon],
        "claimed_time_sec": claimed_time_sec,
        "claimed_time_iso": datetime.fromtimestamp(claimed_time_sec).isoformat(),
        "time_window_minutes": time_window_minutes,
        "matching_sightings_count": len(matching_sightings),
        "cited_sighting_ids": [s["id"] for s in matching_sightings if s.get("id")],
        "evidence_timeline": evidence_timeline,
        "discrepancy_km": round(discrepancy_km, 2),
        "calculated_travel_interval_sec": round(time_delta_sec, 1),
        "required_speed_kmh": round(min(required_speed_kmh, 9999.0), 1),
        "closest_sighting": {
            "sighting_id": cited_id,
            "camera_id": cam_id,
            "camera_name": cam_name,
            "timestamp_sec": closest_s.get("timestamp_sec"),
            "speed_kmh": closest_s.get("speed_kmh", 0.0)
        },
        "explanation": explanation,
        "disclaimer": legal_disclaimer
    }
