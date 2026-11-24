"""
Regression tests for Bug Fix 04:
Prevent Incorrect Vehicle Sighting Responses / Strict Entity Matching & Safe Empty States.
"""
import pytest
import sqlite3
import os
import tempfile
import asyncio
from typing import Dict, Any

from backend.gemini_nl import (
    extract_explicit_plate,
    normalize_plate_string,
    execute_nl_to_sql,
)

@pytest.fixture
def mock_anpr_db(monkeypatch):
    """
    Sets up a temporary SQLite database with crusaders schema and controlled test fixtures.
    """
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE cameras (
            id TEXT PRIMARY KEY,
            name TEXT,
            landmark TEXT,
            lat REAL,
            lon REAL,
            zone TEXT,
            speed_limit INTEGER
        )
    """)
    cur.execute("""
        CREATE TABLE sightings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate TEXT,
            camera_id TEXT,
            timestamp_sec REAL,
            iso_time TEXT,
            speed_kmh REAL,
            confidence REAL,
            vehicle_type TEXT,
            color TEXT,
            flags TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE watchlist (
            plate TEXT PRIMARY KEY,
            reason TEXT,
            severity TEXT,
            added_at TEXT,
            description TEXT,
            status TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT,
            plate TEXT,
            camera_id TEXT,
            timestamp_sec REAL,
            iso_time TEXT,
            severity TEXT,
            details TEXT,
            status TEXT
        )
    """)

    # Seed known cameras
    cur.execute("INSERT INTO cameras VALUES ('CAM_01', 'Connaught Place', 'CP Inner Circle', 28.6328, 77.2197, 'Central Delhi', 50)")
    cur.execute("INSERT INTO cameras VALUES ('CAM_02', 'India Gate', 'C-Hexagon', 28.6129, 77.2295, 'Central Delhi', 50)")

    # Seed known vehicles (DL8CAF2381 / DL 8C AF 2381)
    cur.execute("""
        INSERT INTO sightings (plate, camera_id, timestamp_sec, iso_time, speed_kmh, confidence, vehicle_type, color, flags)
        VALUES ('DL 8C AF 2381', 'CAM_01', 1700000000.0, '2026-11-24T17:40:00', 48.0, 0.98, 'Sedan', 'White', '["NORMAL"]')
    """)
    cur.execute("""
        INSERT INTO sightings (plate, camera_id, timestamp_sec, iso_time, speed_kmh, confidence, vehicle_type, color, flags)
        VALUES ('DL 8C AF 2381', 'CAM_02', 1700000150.0, '2026-11-24T17:42:30', 52.0, 0.99, 'Sedan', 'White', '["NORMAL"]')
    """)
    conn.commit()
    conn.close()

    # Monkeypatch get_db_connection to return this connection
    def get_test_conn():
        c = sqlite3.connect(path)
        c.row_factory = sqlite3.Row
        return c

    monkeypatch.setattr("backend.gemini_nl.get_db_connection", get_test_conn)

    yield path

    if os.path.exists(path):
        os.remove(path)


@pytest.mark.asyncio
async def test_regression_a_unknown_plate(mock_anpr_db):
    """
    Test A: Unknown plate
    Input: QA-DEMO-UNKNOWN
    Expected: Empty results. No vehicle substitution.
    """
    res = await execute_nl_to_sql("QA-DEMO-UNKNOWN")
    assert res["success"] is True
    assert res["found"] is False
    assert res["query_type"] == "vehicle_lookup"
    assert res["requested_plate"] == "QA-DEMO-UNKNOWN"
    assert res["results_count"] == 0
    assert res["results"] == []
    assert "No sightings found for QA-DEMO-UNKNOWN" in res["message"]


@pytest.mark.asyncio
async def test_regression_b_known_plate(mock_anpr_db):
    """
    Test B: Known plate
    Input: DL8CAF2381
    Expected: Only sightings belonging to DL8CAF2381.
    """
    res = await execute_nl_to_sql("DL8CAF2381")
    assert res["success"] is True
    assert res["found"] is True
    assert res["query_type"] == "vehicle_lookup"
    assert res["results_count"] == 2
    for r in res["results"]:
        assert normalize_plate_string(r["plate"]) == "DL8CAF2381"


@pytest.mark.asyncio
async def test_regression_c_similar_plate(mock_anpr_db):
    """
    Test C: Similar plate
    Input: A registration number differing by one character from an existing plate (e.g. DL8CAF2382).
    Expected: No match unless the exact normalized registration exists.
    """
    res = await execute_nl_to_sql("DL8CAF2382")
    assert res["success"] is True
    assert res["found"] is False
    assert res["results_count"] == 0
    assert res["results"] == []


@pytest.mark.asyncio
async def test_regression_d_empty_database(monkeypatch):
    """
    Test D: Empty database
    Input: Any valid registration.
    Expected: Empty response without exceptions or fabricated records.
    """
    fd, empty_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    conn = sqlite3.connect(empty_path)
    conn.execute("CREATE TABLE sightings (id INTEGER, plate TEXT, camera_id TEXT, timestamp_sec REAL, iso_time TEXT, speed_kmh REAL, confidence REAL, vehicle_type TEXT, color TEXT, flags TEXT)")
    conn.execute("CREATE TABLE cameras (id TEXT, name TEXT, landmark TEXT, lat REAL, lon REAL, zone TEXT, speed_limit INTEGER)")
    conn.commit()
    conn.close()

    def get_empty_conn():
        c = sqlite3.connect(empty_path)
        c.row_factory = sqlite3.Row
        return c

    monkeypatch.setattr("backend.gemini_nl.get_db_connection", get_empty_conn)

    res = await execute_nl_to_sql("DL 1C AA 9999")
    assert res["success"] is True
    assert res["found"] is False
    assert res["results_count"] == 0
    assert res["results"] == []
    assert res["error"] is None

    if os.path.exists(empty_path):
        os.remove(empty_path)


@pytest.mark.asyncio
async def test_regression_e_previous_successful_followed_by_unknown(mock_anpr_db):
    """
    Test E: Previous successful query followed by unknown query
    First query: DL8CAF2381
    Second query: QA-DEMO-UNKNOWN
    Expected: The second response must not display the first query's sightings.
    """
    res1 = await execute_nl_to_sql("DL8CAF2381")
    assert res1["found"] is True
    assert res1["results_count"] == 2

    res2 = await execute_nl_to_sql("QA-DEMO-UNKNOWN")
    assert res2["found"] is False
    assert res2["results_count"] == 0
    assert res2["results"] == []
    assert "DL8CAF2381" not in str(res2["results"])


@pytest.mark.asyncio
async def test_regression_f_api_failure(monkeypatch):
    """
    Test F: API failure / database error
    Expected: Return error state, not stale or unrelated data.
    """
    def broken_conn():
        raise sqlite3.OperationalError("Database disk image is malformed")

    monkeypatch.setattr("backend.gemini_nl.get_db_connection", broken_conn)

    res = await execute_nl_to_sql("QA-DEMO-UNKNOWN")
    assert res["success"] is False
    assert res["found"] is False
    assert res["results_count"] == 0
    assert res["results"] == []
    assert res["error"] is not None


@pytest.mark.asyncio
async def test_regression_g_natural_language_query(mock_anpr_db):
    """
    Test G: Natural-language query
    Input: "Show me all sightings for QA-DEMO-UNKNOWN."
    Expected: Exact vehicle lookup and empty results.
    """
    res = await execute_nl_to_sql("Show me all sightings for QA-DEMO-UNKNOWN.")
    assert res["query_type"] == "vehicle_lookup"
    assert res["requested_plate"] == "QA-DEMO-UNKNOWN"
    assert res["found"] is False
    assert res["results_count"] == 0
    assert res["results"] == []
    assert "No sightings found for QA-DEMO-UNKNOWN." in res["message"]
