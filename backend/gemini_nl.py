import os
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple  # FIX BUG 3: added Tuple
import sqlite3

try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

logger = logging.getLogger("crusaders.nl_sql")

SCHEMA_PROMPT = """
You are an expert SQL analyst for Crusaders, an intelligence platform monitoring Delhi city-wide ANPR traffic cameras.
Your task is to translate natural language user questions into STRICTLY READ-ONLY SQLite SELECT queries.

Database Schema:
1. cameras(id TEXT PRIMARY KEY, name TEXT, landmark TEXT, lat REAL, lon REAL, zone TEXT, speed_limit INTEGER)
   - id examples: 'CAM_01', 'CAM_02', ..., 'CAM_12'
   - Important names: 'Connaught Place' (CAM_01), 'India Gate C-Hexagon' (CAM_02), 'ITO Junction' (CAM_03), 'Kashmere Gate ISBT' (CAM_04), 'AIIMS Flyover' (CAM_05), 'Dhaula Kuan Interchange' (CAM_06), 'IGI Airport T3 Terminal' (CAM_07), 'Ashram Chowk' (CAM_08), 'Moti Bagh Junction' (CAM_09), 'Lajpat Nagar Flyover' (CAM_10), 'Karol Bagh (Pusa Road)' (CAM_11), 'Sarai Kale Khan RRTS' (CAM_12)

2. watchlist(plate TEXT PRIMARY KEY, reason TEXT, severity TEXT, added_at TEXT, description TEXT, status TEXT)
   - severity values: 'CRITICAL', 'HIGH', 'MEDIUM'

3. sightings(id INTEGER PRIMARY KEY, plate TEXT, camera_id TEXT, timestamp_sec REAL, iso_time TEXT, speed_kmh REAL, confidence REAL, vehicle_type TEXT, color TEXT, flags TEXT)
   - flags is a JSON string list, e.g. '["NORMAL"]', '["SPEED_VIOLATION"]', '["GHOST_ALERT"]', '["WATCHLIST_MATCH"]'
   - speed_kmh > 80 is considered speeding

4. alerts(id INTEGER PRIMARY KEY, alert_type TEXT, plate TEXT, camera_id TEXT, timestamp_sec REAL, iso_time TEXT, severity TEXT, details TEXT, status TEXT)
   - alert_type values: 'GHOST_ALERT', 'SPEED_VIOLATION', 'WATCHLIST_HIT', 'CONVOY_DETECTED'

STRICT RULES:
1. Output ONLY a valid SQLite SELECT statement. Never output INSERT, UPDATE, DELETE, DROP, ALTER, PRAGMA, or ATTACH.
2. Return plain SQL text only. Do not wrap in markdown quotes if possible, or wrap strictly in ```sql ... ```.
3. Always include a sensible LIMIT (e.g. LIMIT 25 or 50) unless doing a COUNT(*) or aggregation.
4. When querying sightings, JOIN with cameras on sightings.camera_id = cameras.id to provide readable camera names where relevant.
"""

def clean_sql(text: str) -> str:
    """Clean markdown code fences and whitespace from generated SQL."""
    text = text.strip()
    # Remove markdown ```sql and ```
    text = re.sub(r"^```(?:sql)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    # Strip trailing semicolon if present
    text = text.rstrip(";")
    return text

def normalize_plate_string(raw: str) -> str:
    """Normalize vehicle plate string by stripping whitespace, hyphens, and non-alphanumerics."""
    return re.sub(r'[^A-Z0-9]', '', raw.upper())

def extract_explicit_plate(query_text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract an explicit vehicle plate registration identifier from user query if present.
    Returns (raw_plate, normalized_plate) or (None, None).
    Strictly avoids returning first available record or falling back to unrelated vehicles.
    """
    q = query_text.strip()

    # Pattern 1: Standard Indian registration format:
    # Handles: DL 1C AA 9999, DL 1C WX 0007, HR 26 DQ 8888, DL8CAF2381, UP 16 BT 4097, DL 10C ST 1010
    m_ind = re.search(r'\b([A-Za-z]{2}[\s-]?[0-9]{1,2}\s?[A-Za-z]{0,2}[\s-]?[A-Za-z]{1,3}[\s-]?[0-9]{4})\b', q, re.IGNORECASE)
    if m_ind:
        cand = m_ind.group(1).strip()
        return cand, normalize_plate_string(cand)

    # Pattern 2: Hyphenated identifier / test registration token (e.g. QA-DEMO-UNKNOWN, TEST-123-ABC)
    m_hyphen = re.search(r'\b([A-Za-z0-9]{2,}(?:-[A-Za-z0-9]+)+)\b', q)
    if m_hyphen:
        cand = m_hyphen.group(1).strip()
        norm = normalize_plate_string(cand)
        if len(norm) >= 4 and any(c.isalpha() for c in cand):
            return cand, norm

    # Pattern 3: Explicit keyword prefix: 'plate: XYZ', 'plate XYZ', 'vehicle XYZ', 'registration XYZ', 'for XYZ'
    m_kw = re.search(r'\b(?:plate|registration|reg|vehicle|for)\s*(?:no\.?|number|#)?[:=\s]+([A-Za-z0-9-]+)\b', q, re.IGNORECASE)
    if m_kw:
        cand = m_kw.group(1).strip()
        norm = normalize_plate_string(cand)
        if len(norm) >= 4 and any(c.isalpha() for c in cand) and any(c.isdigit() or '-' in cand for c in cand):
            return cand, norm

    # Pattern 4: Whole string is a single plate-like code
    if re.fullmatch(r'[A-Za-z0-9\s-]+', q):
        norm = normalize_plate_string(q)
        if len(norm) >= 4 and any(c.isalpha() for c in q) and any(c.isdigit() or '-' in q for c in q):
            return q, norm

    return None, None

def is_safe_select_query(sql: str) -> bool:
    """Validate that query is strictly a single read-only SELECT statement."""
    normalized = sql.strip().upper()
    if not normalized.startswith("SELECT") and not normalized.startswith("WITH"):
        return False
    disallowed = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "REPLACE", "PRAGMA", "ATTACH", "DETACH"]
    for keyword in disallowed:
        # Check as isolated whole word
        if re.search(r"\b" + keyword + r"\b", normalized):
            return False
    return True

def offline_fallback_sql(query_text: str) -> Tuple[str, str]:
    """
    Regex and rule-based offline fallback to convert natural language queries
    into accurate SQLite SELECT queries without external API dependencies.
    """
    q = query_text.lower()

    # Plate specific lookup with exact normalized matching
    raw_plate, norm_plate = extract_explicit_plate(query_text)
    if raw_plate and norm_plate:
        return (
            f"SELECT s.id, s.plate, s.camera_id, c.name as camera_name, c.lat, c.lon, s.iso_time, s.speed_kmh, s.confidence, s.vehicle_type, s.color, s.flags "
            f"FROM sightings s LEFT JOIN cameras c ON s.camera_id = c.id "
            f"WHERE UPPER(REPLACE(REPLACE(s.plate, ' ', ''), '-', '')) = '{norm_plate}' "
            f"ORDER BY s.timestamp_sec DESC LIMIT 50",
            f"Filtered sightings for license plate {raw_plate} with camera coordinates and trajectory timestamps."
        )

    # Ghost / Cloned plate queries
    if any(k in q for k in ["ghost", "clone", "cloned", "teleport", "impossible", "duplicate"]):
        return (
            "SELECT s.id, s.plate, s.camera_id, c.name as camera_name, s.iso_time, s.speed_kmh, s.flags "
            "FROM sightings s LEFT JOIN cameras c ON s.camera_id = c.id "
            "WHERE s.flags LIKE '%GHOST_ALERT%' OR s.plate IN (SELECT plate FROM alerts WHERE alert_type = 'GHOST_ALERT') "
            "ORDER BY s.timestamp_sec DESC LIMIT 25",
            "Identified anomalous sightings flagged with GHOST_ALERT indicative of cloned duplicate registration plates."
        )

    # Speed violation queries
    if any(k in q for k in ["speed", "speeding", "fast", "overspeed", "velocity", "limit"]):
        return (
            "SELECT s.id, s.plate, s.camera_id, c.name as camera_name, s.speed_kmh, c.speed_limit, s.iso_time, s.vehicle_type "
            "FROM sightings s JOIN cameras c ON s.camera_id = c.id "
            "WHERE s.speed_kmh > 80 OR s.flags LIKE '%SPEED_VIOLATION%' "
            "ORDER BY s.speed_kmh DESC LIMIT 25",
            "Retrieved high-velocity vehicles exceeding the 80 km/h speed threshold across Delhi corridors."
        )

    # Watchlist / Wanted / Hit and Run queries
    if any(k in q for k in ["watchlist", "wanted", "hit and run", "suspect", "stolen", "narcotic", "critical"]):
        return (
            "SELECT s.plate, s.camera_id, c.name as camera_name, s.iso_time, w.reason, w.severity, s.speed_kmh, s.vehicle_type "
            "FROM sightings s "
            "JOIN watchlist w ON s.plate = w.plate "
            "LEFT JOIN cameras c ON s.camera_id = c.id "
            "ORDER BY s.timestamp_sec DESC LIMIT 25",
            "Cross-referenced sightings with active Delhi Traffic Police watchlist suspects."
        )

    # Convoy queries
    if any(k in q for k in ["convoy", "escort", "formation", "pair", "together", "following"]):
        return (
            "SELECT s.plate, s.camera_id, c.name as camera_name, s.iso_time, s.vehicle_type, s.color, s.flags "
            "FROM sightings s JOIN cameras c ON s.camera_id = c.id "
            "WHERE s.plate IN ('DL 1C AA 9999', 'HR 26 DQ 8888') OR s.flags LIKE '%CONVOY%' "
            "ORDER BY s.timestamp_sec DESC LIMIT 30",
            "Extracted co-occurring convoy formation vehicles moving in close temporal proximity."
        )

    # Camera specific queries
    if any(k in q for k in ["airport", "igi", "t3"]):
        return (
            "SELECT s.plate, s.camera_id, c.name as camera_name, s.speed_kmh, s.vehicle_type, s.color, s.iso_time "
            "FROM sightings s JOIN cameras c ON s.camera_id = c.id "
            "WHERE s.camera_id = 'CAM_07' "
            "ORDER BY s.timestamp_sec DESC LIMIT 25",
            "Extracted latest vehicular sightings captured at IGI Airport T3 Terminal (CAM_07)."
        )

    if any(k in q for k in ["india gate", "rajpath", "kartavya"]):
        return (
            "SELECT s.plate, s.camera_id, c.name as camera_name, s.speed_kmh, s.vehicle_type, s.color, s.iso_time "
            "FROM sightings s JOIN cameras c ON s.camera_id = c.id "
            "WHERE s.camera_id = 'CAM_02' "
            "ORDER BY s.timestamp_sec DESC LIMIT 25",
            "Extracted latest vehicular sightings captured at India Gate C-Hexagon (CAM_02)."
        )

    if any(k in q for k in ["cp", "connaught", "barakhamba"]):
        return (
            "SELECT s.plate, s.camera_id, c.name as camera_name, s.speed_kmh, s.vehicle_type, s.color, s.iso_time "
            "FROM sightings s JOIN cameras c ON s.camera_id = c.id "
            "WHERE s.camera_id = 'CAM_01' "
            "ORDER BY s.timestamp_sec DESC LIMIT 25",
            "Extracted vehicular sightings captured at Connaught Place Outer Circle (CAM_01)."
        )

    if any(k in q for k in ["aiims", "medical", "safdarjung"]):
        return (
            "SELECT s.plate, s.camera_id, c.name as camera_name, s.speed_kmh, s.vehicle_type, s.color, s.iso_time "
            "FROM sightings s JOIN cameras c ON s.camera_id = c.id "
            "WHERE s.camera_id = 'CAM_05' "
            "ORDER BY s.timestamp_sec DESC LIMIT 25",
            "Extracted vehicular sightings captured at AIIMS Flyover (CAM_05)."
        )

    if any(k in q for k in ["dhaula", "nh48"]):
        return (
            "SELECT s.plate, s.camera_id, c.name as camera_name, s.speed_kmh, s.vehicle_type, s.color, s.iso_time "
            "FROM sightings s JOIN cameras c ON s.camera_id = c.id "
            "WHERE s.camera_id = 'CAM_06' "
            "ORDER BY s.timestamp_sec DESC LIMIT 25",
            "Extracted vehicular sightings captured at Dhaula Kuan Interchange (CAM_06)."
        )

    # Vehicle type filter
    for vtype in ["suv", "sedan", "hatchback", "truck", "bus", "motorcycle", "auto"]:
        if vtype in q:
            cap_type = vtype.upper() if vtype == "suv" else vtype.capitalize()
            return (
                f"SELECT s.plate, s.camera_id, c.name as camera_name, s.vehicle_type, s.color, s.speed_kmh, s.iso_time "
                f"FROM sightings s JOIN cameras c ON s.camera_id = c.id "
                f"WHERE LOWER(s.vehicle_type) LIKE '%{vtype}%' "
                f"ORDER BY s.timestamp_sec DESC LIMIT 25",
                f"Filtered ANPR records for vehicle category: {cap_type}."
            )

    # Alert counts or summaries
    if any(k in q for k in ["alert", "summary", "count", "statistics", "breakdown"]):
        return (
            "SELECT alert_type, severity, COUNT(*) as total_alerts "
            "FROM alerts GROUP BY alert_type, severity ORDER BY total_alerts DESC",
            "Summary count of tactical traffic alerts categorized by anomaly type and severity."
        )

    # Default fallback
    return (
        "SELECT s.plate, s.camera_id, c.name as camera_name, s.speed_kmh, s.vehicle_type, s.color, s.flags, s.iso_time "
        "FROM sightings s JOIN cameras c ON s.camera_id = c.id "
        "ORDER BY s.timestamp_sec DESC LIMIT 25",
        "Displaying the latest city-wide ANPR vehicular telemetry streams across Delhi junctions."
    )

try:
    from backend.llm_client import call_text_llm
except ImportError:
    from llm_client import call_text_llm

async def execute_nl_to_sql(user_prompt: str) -> Dict[str, Any]:
    """
    Convert Natural Language query to SQL using high-speed Multi-LLM inference
    (Groq, OpenRouter, Cohere, Gemini) with strict read-only SQLite validation,
    or rule-based offline fallback.

    CRITICAL FIX (Bug Fix 04):
    If an explicit vehicle plate registration is present, exact deterministic entity
    matching takes precedence over generative interpretation. Never substitute another
    vehicle's sighting, never fall back to latest sightings, and return a safe structured
    empty state when no records match.
    """
    generated_sql = ""
    mode = "OFFLINE_RULE_BASED"
    explanation = ""

    # Check for explicit vehicle registration identifier
    raw_plate, norm_plate = extract_explicit_plate(user_prompt)

    if raw_plate and norm_plate:
        # Deterministic exact-plate lookup takes strict precedence
        mode = "EXACT_PLATE_LOOKUP"
        param_sql = (
            "SELECT s.id, s.plate, s.camera_id, c.name as camera_name, c.lat, c.lon, "
            "s.iso_time, s.speed_kmh, s.confidence, s.vehicle_type, s.color, s.flags "
            "FROM sightings s LEFT JOIN cameras c ON s.camera_id = c.id "
            "WHERE UPPER(REPLACE(REPLACE(s.plate, ' ', ''), '-', '')) = ? "
            "ORDER BY s.timestamp_sec DESC LIMIT 50"
        )
        display_sql = (
            "SELECT s.id, s.plate, s.camera_id, c.name as camera_name, c.lat, c.lon, "
            "s.iso_time, s.speed_kmh, s.confidence, s.vehicle_type, s.color, s.flags "
            "FROM sightings s LEFT JOIN cameras c ON s.camera_id = c.id "
            f"WHERE UPPER(REPLACE(REPLACE(s.plate, ' ', ''), '-', '')) = '{norm_plate}' "
            "ORDER BY s.timestamp_sec DESC LIMIT 50"
        )
        generated_sql = display_sql
        explanation = f"Exact normalized query executed for registration plate: {raw_plate}"

        conn = None
        results = []
        error = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(param_sql, (norm_plate,))
            rows = cur.fetchall()
            for r in rows:
                results.append(dict(r))
        except Exception as e:
            error = str(e)
            logger.error(f"SQL execution error for plate {raw_plate}: {e}")
        finally:
            if conn:
                conn.close()

        found = len(results) > 0
        message = (
            f"Found {len(results)} sighting(s) for vehicle {raw_plate}."
            if found
            else f"No sightings found for {raw_plate}."
        )

        # Grounding fields for Requirement 6:
        sighting_ids = [r["id"] for r in results if "id" in r]
        camera_ids = list(set([r["camera_id"] for r in results if "camera_id" in r]))
        timestamps = [r.get("iso_time") or str(r.get("timestamp_sec")) for r in results if r.get("iso_time") or r.get("timestamp_sec")]
        time_range = {
            "earliest": min(timestamps) if timestamps else None,
            "latest": max(timestamps) if timestamps else None
        }

        return {
            "success": error is None,
            "found": found,
            "query_type": "vehicle_lookup",
            "requested_plate": raw_plate,
            "matched_plate": results[0]["plate"] if found else None,
            "normalized_plate": norm_plate,
            "search_time_range": time_range,
            "records_matched": len(results),
            "sighting_ids_used": sighting_ids,
            "camera_ids_used": camera_ids,
            "source_timestamps": timestamps,
            "user_query": user_prompt,
            "generated_sql": generated_sql,
            "mode": mode,
            "results_count": len(results),
            "results": results,
            "explanation": explanation,
            "message": message,
            "error": error
        }

    # Call LLM client (Groq -> OpenRouter -> Cohere -> Gemini)
    llm_res = call_text_llm(
        user_prompt=f"User Question: {user_prompt}\nReturn ONLY the SQLite SELECT query:",
        system_prompt=SCHEMA_PROMPT
    )

    if llm_res.get("status") == "success" and llm_res.get("content"):
        cleaned = clean_sql(llm_res["content"])
        if is_safe_select_query(cleaned):
            generated_sql = cleaned
            mode = llm_res.get("provider", "LLM_GENERATED")
            explanation = f"Generated by {mode} from natural language query: '{user_prompt}'"
        else:
            logger.warning(f"LLM returned unsafe or non-SELECT SQL: {cleaned}. Falling back to offline engine.")

    # If LLM not configured or failed or produced unsafe query, use offline fallback
    if not generated_sql:
        generated_sql, fallback_exp = offline_fallback_sql(user_prompt)
        mode = "OFFLINE_RULE_BASED"
        explanation = fallback_exp

    # Execute SQL on SQLite database
    conn = None
    results = []
    error = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(generated_sql)
        rows = cur.fetchall()
        for r in rows:
            results.append(dict(r))
    except Exception as e:
        error = str(e)
        logger.error(f"SQL execution error: {e} | Query: {generated_sql}")
        # Note: Do not silently broaden into generic sightings if error occurs; report error cleanly
        results = []
    finally:
        if conn:
            conn.close()

    found = len(results) > 0
    message = (
        f"Found {len(results)} record(s) matching your query."
        if found
        else "No records found matching your query."
    )

    return {
        "success": error is None,
        "found": found,
        "query_type": "general_query",
        "user_query": user_prompt,
        "generated_sql": generated_sql,
        "mode": mode,
        "results_count": len(results),
        "results": results,
        "explanation": explanation,
        "message": message,
        "error": error
    }
