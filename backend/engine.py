import math
import os
import re
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import networkx as nx

logger = logging.getLogger("crusaders.engine")

# 12 Real Delhi Traffic Junctions (CAM_01 to CAM_12)
DELHI_CAMERAS: Dict[str, Dict[str, Any]] = {
    "CAM_01": {
        "id": "CAM_01",
        "name": "Connaught Place",
        "landmark": "Outer Circle (Barakhamba Rd Entry)",
        "lat": 28.6328,
        "lon": 77.2197,
        "zone": "Central Delhi",
        "speed_limit": 50
    },
    "CAM_02": {
        "id": "CAM_02",
        "name": "India Gate C-Hexagon",
        "landmark": "Kartavya Path / Rajpath Crossing",
        "lat": 28.6129,
        "lon": 77.2295,
        "zone": "New Delhi VIP Zone",
        "speed_limit": 60
    },
    "CAM_03": {
        "id": "CAM_03",
        "name": "ITO Junction",
        "landmark": "Vikas Marg & Bahadur Shah Zafar Marg",
        "lat": 28.6289,
        "lon": 77.2410,
        "zone": "Central / Trans-Yamuna Corridor",
        "speed_limit": 50
    },
    "CAM_04": {
        "id": "CAM_04",
        "name": "Kashmere Gate ISBT",
        "landmark": "Ring Road / Old Delhi Gate",
        "lat": 28.6665,
        "lon": 77.2332,
        "zone": "North Delhi Inter-State Hub",
        "speed_limit": 60
    },
    "CAM_05": {
        "id": "CAM_05",
        "name": "AIIMS Flyover",
        "landmark": "Ring Road & Sri Aurobindo Marg",
        "lat": 28.5672,
        "lon": 77.2100,
        "zone": "South Delhi Medical Corridor",
        "speed_limit": 60
    },
    "CAM_06": {
        "id": "CAM_06",
        "name": "Dhaula Kuan Interchange",
        "landmark": "National Highway 48 & Ring Road Flyover",
        "lat": 28.5921,
        "lon": 77.1616,
        "zone": "South-West Transit Hub",
        "speed_limit": 70
    },
    "CAM_07": {
        "id": "CAM_07",
        "name": "IGI Airport T3 Terminal",
        "landmark": "Indira Gandhi Int'l Airport Access Expressway",
        "lat": 28.5562,
        "lon": 77.1000,
        "zone": "Airport Security Perimeter",
        "speed_limit": 70
    },
    "CAM_08": {
        "id": "CAM_08",
        "name": "Ashram Chowk",
        "landmark": "Mathura Road & Ring Road Junction",
        "lat": 28.5707,
        "lon": 77.2588,
        "zone": "South-East Arterial Hub",
        "speed_limit": 60
    },
    "CAM_09": {
        "id": "CAM_09",
        "name": "Moti Bagh Junction",
        "landmark": "Ring Road & Shanti Path Intersection",
        "lat": 28.5833,
        "lon": 77.1744,
        "zone": "Diplomatic Enclave / South Delhi",
        "speed_limit": 60
    },
    "CAM_10": {
        "id": "CAM_10",
        "name": "Lajpat Nagar Flyover",
        "landmark": "Ring Road Central Market Axis",
        "lat": 28.5700,
        "lon": 77.2400,
        "zone": "South Delhi Ring Corridor",
        "speed_limit": 60
    },
    "CAM_11": {
        "id": "CAM_11",
        "name": "Karol Bagh (Pusa Road)",
        "landmark": "Pusa Road Metro Pillar 110",
        "lat": 28.6469,
        "lon": 77.1895,
        "zone": "West-Central Commercial Corridor",
        "speed_limit": 50
    },
    "CAM_12": {
        "id": "CAM_12",
        "name": "Sarai Kale Khan RRTS",
        "landmark": "Ring Road & Barapullah Elevated Junction",
        "lat": 28.5885,
        "lon": 77.2550,
        "zone": "East-South High-Speed Transit Corridor",
        "speed_limit": 70
    }
}

# Simulated PCR Police Patrol Units stationed across Delhi
PCR_UNITS = [
    {"id": "PCR_01", "callsign": "Viper-1", "station": "Connaught Place", "lat": 28.6315, "lon": 77.2180, "officer": "Insp. R. Sharma", "vehicle": "Mahindra Scorpio-N"},
    {"id": "PCR_02", "callsign": "Cheetah-2", "station": "India Gate / Tilak Marg", "lat": 28.6140, "lon": 28.6140, "officer": "Sub-Insp. A. Yadav", "vehicle": "Toyota Innova Crysta"},
    {"id": "PCR_03", "callsign": "Eagle-3", "station": "Dhaula Kuan NH48", "lat": 28.5910, "lon": 77.1630, "officer": "Insp. V. Tanwar", "vehicle": "Maruti Gypsy 4x4"},
    {"id": "PCR_04", "callsign": "Rhino-4", "station": "AIIMS Trauma Center Axis", "lat": 28.5685, "lon": 77.2085, "officer": "Sub-Insp. S. Malik", "vehicle": "Mahindra Bolero Neo"},
    {"id": "PCR_05", "callsign": "Panther-5", "station": "Ashram Chowk Bypass", "lat": 28.5720, "lon": 77.2570, "officer": "Insp. K. Singh", "vehicle": "Mahindra Scorpio-N"},
    {"id": "PCR_06", "callsign": "Falcon-6", "station": "IGI Airport Expressway", "lat": 28.5620, "lon": 77.1080, "officer": "Sub-Insp. M. Hooda", "vehicle": "Toyota Hilux Rapid Interceptor"}
]
# Fix coordinates for PCR_02
PCR_UNITS[1]["lat"] = 28.6140
PCR_UNITS[1]["lon"] = 77.2310

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in kilometers between two lat/lon points."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class CityGraphEngine:
    def __init__(self):
        self.G = nx.DiGraph()
        self._build_city_graph()
        self._build_markov_matrix()

    def _build_city_graph(self):
        """Construct Delhi 12-camera directed weighted graph in NetworkX."""
        # Add nodes with geographical metadata
        for cam_id, meta in DELHI_CAMERAS.items():
            self.G.add_node(
                cam_id,
                name=meta["name"],
                landmark=meta["landmark"],
                lat=meta["lat"],
                lon=meta["lon"],
                zone=meta["zone"],
                speed_limit=meta["speed_limit"]
            )

        # Arterial corridor road connections with minimum travel times (seconds)
        # assuming clear traffic at legal max speed (~75-90 km/h) plus signal latency.
        # Format: (from_cam, to_cam, min_time_seconds, length_km, road_name)
        edges = [
            # Connaught Place (CAM_01) connections
            ("CAM_01", "CAM_02", 130, 2.6, "Janpath / Kasturba Gandhi Marg"),
            ("CAM_02", "CAM_01", 130, 2.6, "Janpath / Kasturba Gandhi Marg"),
            ("CAM_01", "CAM_03", 110, 2.2, "Barakhamba / Tilak Bridge"),
            ("CAM_03", "CAM_01", 110, 2.2, "Barakhamba / Tilak Bridge"),
            ("CAM_01", "CAM_11", 175, 3.5, "Pusa Road Axis"),
            ("CAM_11", "CAM_01", 175, 3.5, "Pusa Road Axis"),
            ("CAM_01", "CAM_04", 200, 4.2, "Netaji Subhash Marg"),
            ("CAM_04", "CAM_01", 200, 4.2, "Netaji Subhash Marg"),

            # Kashmere Gate (CAM_04) connections
            ("CAM_04", "CAM_03", 210, 4.3, "Ring Road Bypass (Yamuna Bank)"),
            ("CAM_03", "CAM_04", 210, 4.3, "Ring Road Bypass (Yamuna Bank)"),
            ("CAM_04", "CAM_11", 240, 5.0, "Rani Jhansi Road"),
            ("CAM_11", "CAM_04", 240, 5.0, "Rani Jhansi Road"),

            # India Gate (CAM_02) connections
            ("CAM_02", "CAM_03", 120, 2.4, "Purana Qila Road"),
            ("CAM_03", "CAM_02", 120, 2.4, "Purana Qila Road"),
            ("CAM_02", "CAM_12", 190, 3.9, "Sundar Nagar / Bhairon Marg"),
            ("CAM_12", "CAM_02", 190, 3.9, "Sundar Nagar / Bhairon Marg"),
            ("CAM_02", "CAM_05", 260, 5.4, "Sri Aurobindo Marg"),
            ("CAM_05", "CAM_02", 260, 5.4, "Sri Aurobindo Marg"),

            # ITO (CAM_03) & Sarai Kale Khan (CAM_12)
            ("CAM_03", "CAM_12", 230, 4.8, "Ring Road Sarai Kale Khan Axis"),
            ("CAM_12", "CAM_03", 230, 4.8, "Ring Road Sarai Kale Khan Axis"),

            # South Ring Road & Flyovers
            ("CAM_05", "CAM_10", 150, 3.2, "Ring Road South Extension"),
            ("CAM_10", "CAM_05", 150, 3.2, "Ring Road South Extension"),
            ("CAM_10", "CAM_08", 95, 2.0, "Ring Road Ashram Link"),
            ("CAM_08", "CAM_10", 95, 2.0, "Ring Road Ashram Link"),
            ("CAM_08", "CAM_12", 110, 2.3, "Ring Road / RRTS Terminal Axis"),
            ("CAM_12", "CAM_08", 110, 2.3, "Ring Road / RRTS Terminal Axis"),

            # West Corridor & Airport
            ("CAM_05", "CAM_09", 180, 3.7, "Ring Road Safdarjung Axis"),
            ("CAM_09", "CAM_05", 180, 3.7, "Ring Road Safdarjung Axis"),
            ("CAM_09", "CAM_06", 100, 2.1, "Ring Road Moti Bagh Flyover"),
            ("CAM_06", "CAM_09", 100, 2.1, "Ring Road Moti Bagh Flyover"),
            ("CAM_06", "CAM_07", 320, 7.2, "NH48 Delhi-Gurgaon Expressway"),
            ("CAM_07", "CAM_06", 320, 7.2, "NH48 Delhi-Gurgaon Expressway"),
            ("CAM_11", "CAM_06", 280, 6.4, "Ridge Road / Dhaula Kuan Link"),
            ("CAM_06", "CAM_11", 280, 6.4, "Ridge Road / Dhaula Kuan Link"),
        ]

        for u, v, min_time, length_km, road_name in edges:
            self.G.add_edge(u, v, min_time=min_time, length_km=length_km, road_name=road_name)

    def _build_markov_matrix(self):
        """Construct Markov Chain transition probabilities from outgoing edges."""
        self.markov_transitions: Dict[str, Dict[str, float]] = {}
        for node in self.G.nodes():
            successors = list(self.G.successors(node))
            if not successors:
                continue
            # Weight transition probabilities inversely proportional to minimum travel time
            # (closer/faster major arterial connections have higher flow probability)
            inv_weights = {succ: 1.0 / self.G[node][succ]["min_time"] for succ in successors}
            total = sum(inv_weights.values())
            self.markov_transitions[node] = {succ: round(w / total, 3) for succ, w in inv_weights.items()}

    def get_cameras_geojson(self) -> Dict[str, Any]:
        """Return GeoJSON feature collection of all cameras."""
        features = []
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
                    "speed_limit": meta["speed_limit"]
                }
            })
        return {"type": "FeatureCollection", "features": features}

    def get_network_edges(self) -> List[Dict[str, Any]]:
        """Return list of directed graph edges for rendering on Leaflet map."""
        result = []
        for u, v, data in self.G.edges(data=True):
            result.append({
                "from_cam": u,
                "to_cam": v,
                "from_coord": [DELHI_CAMERAS[u]["lat"], DELHI_CAMERAS[u]["lon"]],
                "to_coord": [DELHI_CAMERAS[v]["lat"], DELHI_CAMERAS[v]["lon"]],
                "min_time_sec": data.get("min_time", 180),
                "length_km": data.get("length_km", 3.0),
                "road_name": data.get("road_name", "Arterial Link")
            })
        return result

    def inspect_sighting(
        self,
        current_cam: str,
        current_time_sec: float,
        previous_sighting: Optional[Dict[str, Any]],
        confidence: float
    ) -> Dict[str, Any]:
        """
        Trajectory & Anomaly Engine:
        1. Confidence filter: Discard any reading with confidence < 0.75.
        2. Dijkstra path length check:
           If actual_time < 0.65 * dijkstra_min_time -> GHOST_ALERT (cloned plate).
        3. Speed check:
           Haversine distance / elapsed hours. If > 80 km/h -> SPEED_VIOLATION.
        """
        # Confidence check
        if confidence < 0.75:
            return {
                "valid": False,
                "reason": f"Low ANPR confidence score ({confidence:.2f} < 0.75 threshold)",
                "flags": ["LOW_CONFIDENCE_DISCARDED"]
            }

        flags: List[str] = []
        anomaly_details: Dict[str, Any] = {}
        speed_kmh = 0.0

        if previous_sighting:
            prev_cam = previous_sighting["camera_id"]
            prev_time_sec = previous_sighting["timestamp_sec"]
            actual_time = current_time_sec - prev_time_sec

            # Avoid division by zero
            if actual_time <= 0.01:
                actual_time = 0.1

            # 1. Dijkstra Path Length Anomaly (Ghost Plate)
            if prev_cam != current_cam:
                try:
                    if nx.has_path(self.G, prev_cam, current_cam):
                        dijkstra_min_time = nx.dijkstra_path_length(self.G, prev_cam, current_cam, weight="min_time")
                        path_nodes = nx.dijkstra_path(self.G, prev_cam, current_cam, weight="min_time")
                    else:
                        # Fallback physical minimum: straight-line distance at 120 km/h
                        p1 = DELHI_CAMERAS[prev_cam]
                        p2 = DELHI_CAMERAS[current_cam]
                        h_dist = haversine_km(p1["lat"], p1["lon"], p2["lat"], p2["lon"])
                        dijkstra_min_time = (h_dist / 120.0) * 3600.0
                        path_nodes = [prev_cam, current_cam]

                    threshold_time = 0.65 * dijkstra_min_time
                    anomaly_details["dijkstra_min_time_sec"] = round(dijkstra_min_time, 1)
                    anomaly_details["actual_time_sec"] = round(actual_time, 1)
                    anomaly_details["dijkstra_path"] = path_nodes

                    if actual_time < threshold_time:
                        flags.append("GHOST_ALERT")
                        anomaly_details["ghost_severity"] = "CRITICAL"
                        anomaly_details["ghost_explanation"] = (
                            f"Vehicle teleported from {prev_cam} ({DELHI_CAMERAS[prev_cam]['name']}) "
                            f"to {current_cam} ({DELHI_CAMERAS[current_cam]['name']}) in {actual_time:.1f}s. "
                            f"Minimum theoretical physical time is {dijkstra_min_time:.1f}s (threshold: {threshold_time:.1f}s). "
                            "Indicative of cloned duplicate registration plates operating concurrently."
                        )
                except Exception as e:
                    logger.warning(f"Error computing dijkstra: {e}")

                # 2. Haversine Speed Violation Check
                p1 = DELHI_CAMERAS[prev_cam]
                p2 = DELHI_CAMERAS[current_cam]
                h_dist_km = haversine_km(p1["lat"], p1["lon"], p2["lat"], p2["lon"])
                hours = actual_time / 3600.0
                speed_kmh = round(h_dist_km / hours, 1) if hours > 0 else 0.0

                anomaly_details["haversine_distance_km"] = round(h_dist_km, 2)
                anomaly_details["speed_kmh"] = speed_kmh

                if speed_kmh > 80.0:
                    flags.append("SPEED_VIOLATION")
                    anomaly_details["speed_explanation"] = (
                        f"Calculated velocity between {prev_cam} and {current_cam} is {speed_kmh} km/h, "
                        f"violating Delhi urban arterial speed ceiling of 80 km/h."
                    )
            else:
                # Same camera sighting within quick succession
                speed_kmh = 35.0

        if not flags:
            flags.append("NORMAL")

        return {
            "valid": True,
            "flags": flags,
            "speed_kmh": speed_kmh,
            "anomaly_details": anomaly_details
        }

    def predict_next_trajectory(self, current_cam: str, prev_cam: Optional[str] = None) -> Dict[str, Any]:
        """
        Markov Chain Transition Matrix:
        Predict top 2 next likely cameras, ETA countdown (seconds),
        and find the nearest simulated PCR police unit for interception dispatch.
        """
        transitions = self.markov_transitions.get(current_cam, {})
        # If prev_cam exists, give slight momentum discount away from returning backwards
        adjusted = {}
        for succ, prob in transitions.items():
            weight = prob
            if prev_cam and succ == prev_cam:
                weight = weight * 0.4
            adjusted[succ] = weight

        # Normalize
        total = sum(adjusted.values()) or 1.0
        sorted_preds = sorted([(succ, w / total) for succ, w in adjusted.items()], key=lambda x: x[1], reverse=True)

        top_2 = []
        for succ, prob in sorted_preds[:2]:
            min_t = self.G[current_cam][succ]["min_time"] if self.G.has_edge(current_cam, succ) else 150
            # Realistic traffic ETA factor (~1.25x)
            traffic_eta_sec = int(min_t * 1.25)
            top_2.append({
                "camera_id": succ,
                "camera_name": DELHI_CAMERAS[succ]["name"],
                "probability": round(prob, 2),
                "eta_seconds": traffic_eta_sec,
                "coordinates": [DELHI_CAMERAS[succ]["lat"], DELHI_CAMERAS[succ]["lon"]],
                "road": self.G[current_cam][succ].get("road_name", "Arterial link") if self.G.has_edge(current_cam, succ) else ""
            })

        # Nearest simulated PCR police unit to the top projected camera
        target_cam = top_2[0]["camera_id"] if top_2 else current_cam
        target_lat = DELHI_CAMERAS[target_cam]["lat"]
        target_lon = DELHI_CAMERAS[target_cam]["lon"]

        nearest_pcr = None
        min_pcr_dist = float("inf")
        for pcr in PCR_UNITS:
            dist = haversine_km(pcr["lat"], pcr["lon"], target_lat, target_lon)
            if dist < min_pcr_dist:
                min_pcr_dist = dist
                nearest_pcr = {
                    **pcr,
                    "distance_km": round(dist, 2),
                    "intercept_eta_min": max(1, round(dist / 45.0 * 60, 1)) # 45 km/h PCR response speed
                }

        return {
            "top_predictions": top_2,
            "recommended_interception": {
                "intercept_camera": target_cam,
                "intercept_camera_name": DELHI_CAMERAS[target_cam]["name"],
                "nearest_pcr": nearest_pcr
            }
        }

    def detect_convoys(self, sightings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convoy Detector:
        Find pairs of plates co-occurring within 45 seconds across >= 3 junctions.
        """
        # Group sightings by camera
        cam_groups: Dict[str, List[Dict[str, Any]]] = {}
        for s in sightings:
            cid = s["camera_id"]
            cam_groups.setdefault(cid, []).append(s)

        # Map pair of plates -> set of cameras where they co-occurred within 45 seconds
        pair_sightings: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}

        for cid, cam_sightings in cam_groups.items():
            # Sort chronologically
            cam_sightings_sorted = sorted(cam_sightings, key=lambda x: x["timestamp_sec"])
            n = len(cam_sightings_sorted)
            for i in range(n):
                for j in range(i + 1, n):
                    s1 = cam_sightings_sorted[i]
                    s2 = cam_sightings_sorted[j]
                    time_diff = abs(s1["timestamp_sec"] - s2["timestamp_sec"])
                    if time_diff <= 45.0:
                        p1, p2 = s1["plate"], s2["plate"]
                        if p1 == p2:
                            continue
                        pair_key = tuple(sorted([p1, p2]))
                        pair_sightings.setdefault(pair_key, []).append({
                            "camera_id": cid,
                            "camera_name": DELHI_CAMERAS.get(cid, {}).get("name", cid),
                            "t1": s1["timestamp_sec"],
                            "t2": s2["timestamp_sec"],
                            "dt_sec": round(time_diff, 1)
                        })

        convoys = []
        for (plate_a, plate_b), co_events in pair_sightings.items():
            # Get distinct camera ids
            distinct_cams = list(dict.fromkeys([ev["camera_id"] for ev in co_events]))
            if len(distinct_cams) >= 3:
                convoys.append({
                    "plates": [plate_a, plate_b],
                    "co_occurrence_count": len(distinct_cams),
                    "cameras_traversed": distinct_cams,
                    "junction_names": [DELHI_CAMERAS[cid]["name"] for cid in distinct_cams if cid in DELHI_CAMERAS],
                    "events": co_events,
                    "confidence_score": 0.92,
                    "risk_assessment": "High-confidence tactical convoy / escort formation"
                })

        return convoys

    def check_alibi(
        self,
        plate: str,
        claimed_lat: float,
        claimed_lon: float,
        claimed_time_sec: float,
        plate_sightings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Alibi Checker (POST /api/alibi):
        Returns CONFIRMED or BROKEN with Haversine distance discrepancy.
        """
        if not plate_sightings:
            return {
                "plate": plate,
                "status": "INCONCLUSIVE",
                "verdict": "NO_ANPR_HISTORY",
                "discrepancy_km": 0.0,
                "explanation": f"No ANPR sightings recorded for plate {plate} in the municipal surveillance database."
            }

        # Find the sighting closest in time to claimed_time_sec
        closest_s = min(plate_sightings, key=lambda s: abs(s["timestamp_sec"] - claimed_time_sec))
        time_delta_sec = abs(closest_s["timestamp_sec"] - claimed_time_sec)
        cam_info = DELHI_CAMERAS[closest_s["camera_id"]]

        # Calculate Haversine distance discrepancy
        discrepancy_km = haversine_km(claimed_lat, claimed_lon, cam_info["lat"], cam_info["lon"])

        # Travel speed required to cover this discrepancy in time_delta_sec
        required_speed_kmh = (discrepancy_km / (time_delta_sec / 3600.0)) if time_delta_sec > 10 else 9999.0

        # Verdict logic:
        # If camera spotted the vehicle within 15 minutes but > 2.5 km away,
        # or if required speed > 100 km/h, the alibi is BROKEN.
        is_broken = False
        if time_delta_sec < 900 and discrepancy_km > 2.0:
            is_broken = True
        elif required_speed_kmh > 110.0:
            is_broken = True

        status = "BROKEN" if is_broken else "CONFIRMED"

        explanation = ""
        if status == "BROKEN":
            explanation = (
                f"Alibi BROKEN: Suspect claims to have been at [{claimed_lat:.4f}, {claimed_lon:.4f}] "
                f"at timestamp {int(claimed_time_sec)}, but plate was captured by camera {closest_s['camera_id']} "
                f"({cam_info['name']}) at timestamp {int(closest_s['timestamp_sec'])} "
                f"({int(time_delta_sec)}s difference). Spatial discrepancy is {discrepancy_km:.2f} km, "
                f"requiring an impossible transit velocity of {min(required_speed_kmh, 999.0):.1f} km/h."
            )
        else:
            explanation = (
                f"Alibi CONFIRMED: Claimed location matches registered sighting trajectory. "
                f"Recorded camera {closest_s['camera_id']} ({cam_info['name']}) is within feasible distance "
                f"({discrepancy_km:.2f} km discrepancy, {time_delta_sec:.0f}s delta)."
            )

        return {
            "plate": plate,
            "status": status,
            "discrepancy_km": round(discrepancy_km, 2),
            "time_delta_sec": round(time_delta_sec, 1),
            "claimed_coords": [claimed_lat, claimed_lon],
            "closest_sighting": {
                "camera_id": closest_s["camera_id"],
                "camera_name": cam_info["name"],
                "timestamp_sec": closest_s["timestamp_sec"],
                "speed_kmh": closest_s.get("speed_kmh", 0)
            },
            "explanation": explanation
        }

city_engine = CityGraphEngine()
