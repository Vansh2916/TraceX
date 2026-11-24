"""
Unit tests for geospatial mathematics.
"""
import pytest
from backend.geo_utils import (
    haversine_distance_km,
    calculate_initial_bearing,
    bearing_to_compass,
    compute_interval_speed_kmh
)

def test_identical_points_distance():
    dist = haversine_distance_km(28.6139, 77.2090, 28.6139, 77.2090)
    assert dist == 0.0

def test_cardinal_bearing():
    # Moving due North
    bearing = calculate_initial_bearing(28.0, 77.0, 29.0, 77.0)
    assert pytest.approx(bearing, 0.5) == 0.0 or pytest.approx(bearing, 0.5) == 360.0
    assert bearing_to_compass(0.0) == "N"

def test_zero_time_infinite_speed():
    speed = compute_interval_speed_kmh(1.0, 0.0)
    assert speed >= 9999.0
