"""
Geospatial Mathematics and Trajectory Calculation Utilities.
"""
import math
from typing import Tuple, Dict, Optional

EARTH_RADIUS_KM = 6371.0

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes Great Circle distance between two lat/lon coordinates in kilometers."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def calculate_initial_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates forward azimuth / bearing from point 1 to point 2 in degrees [0, 360)."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    x = math.sin(delta_lambda) * math.cos(phi2)
    y = (math.cos(phi1) * math.sin(phi2) -
         math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda))

    initial_bearing = math.atan2(x, y)
    initial_bearing_deg = math.degrees(initial_bearing)
    return (initial_bearing_deg + 360.0) % 360.0

def bearing_to_compass(bearing: float) -> str:
    """Converts bearing in degrees to 8-point compass quadrant."""
    quadrants = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    idx = int((bearing + 22.5) / 45.0) % 8
    return quadrants[idx]

def compute_interval_speed_kmh(dist_km: float, time_delta_sec: float) -> float:
    """Computes velocity in km/h with division-by-zero safeguard."""
    if time_delta_sec <= 0.001:
        return 9999.0  # Instantaneous jump indicates ghost/cloned plate
    hours = time_delta_sec / 3600.0
    return dist_km / hours
