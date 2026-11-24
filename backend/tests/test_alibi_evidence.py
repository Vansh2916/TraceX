"""
Tests for Requirement 5: Evidence-backed Alibi Verification.
"""
from backend.alibi_service import evaluate_alibi_evidence

def test_alibi_insufficient_evidence():
    result = evaluate_alibi_evidence(
        plate="UNKNOWN999",
        claimed_lat=28.6129,
        claimed_lon=77.2295,
        claimed_time_sec=1700000000,
        sighting_records=[]
    )
    assert result["outcome"] == "INSUFFICIENT EVIDENCE"
    assert result["matching_sightings_count"] == 0
    assert result["cited_sighting_ids"] == []
    assert "proof" not in result["explanation"].lower()
    assert "disclaimer" in result

def test_alibi_inconsistent_transit_impossibility():
    sightings = [
        {
            "id": 101,
            "plate": "DL8CAF2381",
            "camera_id": "CAM_01",
            "timestamp_sec": 1700000050,  # 50 seconds after claimed time
            "speed_kmh": 45.0
        }
    ]
    # Claimed location at IGI Airport (~15 km away) 50 seconds before sighting at CAM_01
    result = evaluate_alibi_evidence(
        plate="DL8CAF2381",
        claimed_lat=28.5562,  # IGI Airport
        claimed_lon=77.1000,
        claimed_time_sec=1700000000,
        sighting_records=sightings
    )
    assert result["outcome"] == "INSUFFICIENT EVIDENCE" or result["outcome"] == "INCONSISTENT"
    assert result["outcome"] == "INCONSISTENT"
    assert 101 in result["cited_sighting_ids"]
    assert result["required_speed_kmh"] > 110.0
    assert "contradict" in result["explanation"].lower() or "impossibility" in result["explanation"].lower()

def test_alibi_consistent_feasible_movement():
    sightings = [
        {
            "id": 202,
            "plate": "DL8CAF2381",
            "camera_id": "CAM_02",  # India Gate
            "timestamp_sec": 1700001800,  # 30 mins after claimed time
            "speed_kmh": 40.0
        }
    ]
    # Claimed location at Connaught Place (~3 km away) 30 mins prior -> feasible transit
    result = evaluate_alibi_evidence(
        plate="DL8CAF2381",
        claimed_lat=28.6328,  # Connaught Place
        claimed_lon=77.2197,
        claimed_time_sec=1700000000,
        sighting_records=sightings,
        time_window_minutes=60
    )
    assert result["outcome"] == "CONSISTENT"
    assert 202 in result["cited_sighting_ids"]
    assert "not contradict" in result["explanation"].lower()
    assert "disclaimer" in result
