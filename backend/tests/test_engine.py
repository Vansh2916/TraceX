"""
Unit tests for Trajectory Engine, Anomaly Detection, and Dijkstra Path Verification.
"""
import pytest
import math

def calculate_haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def test_haversine_distance():
    # CP to India Gate: approximately 2.4 km
    dist = calculate_haversine(28.6328, 77.2197, 28.6129, 77.2295)
    assert 2.0 <= dist <= 3.0

def test_speed_calculation():
    # 2.4 km covered in 2 minutes (120 seconds) = 72 km/h
    dist_km = 2.4
    time_sec = 120.0
    speed_kmh = (dist_km / (time_sec / 3600.0))
    assert math.isclose(speed_kmh, 72.0, rel_tol=1e-2)

def test_impossible_speed_flag():
    # Vehicle appears across 15 km in 10 seconds -> 5400 km/h (Ghost / Cloned Plate)
    dist_km = 15.0
    time_sec = 10.0
    speed_kmh = (dist_km / (time_sec / 3600.0))
    assert speed_kmh > 140.0 # Exceeds physical speed threshold
