"""
Tests for Requirement 6: Grounded Assistant Responses.
"""
import pytest
import sqlite3
from backend.gemini_nl import execute_nl_to_sql

@pytest.fixture
def mock_db_with_known_vehicle(monkeypatch):
    test_conn = sqlite3.connect(":memory:")
    test_conn.row_factory = sqlite3.Row
    test_conn.execute("CREATE TABLE cameras (id TEXT, name TEXT, landmark TEXT, lat REAL, lon REAL, zone TEXT, speed_limit INTEGER)")
    test_conn.execute("CREATE TABLE sightings (id INTEGER PRIMARY KEY, plate TEXT, camera_id TEXT, timestamp_sec REAL, iso_time TEXT, speed_kmh REAL, confidence REAL, vehicle_type TEXT, color TEXT, flags TEXT)")
    test_conn.execute("INSERT INTO cameras VALUES ('CAM_01', 'Connaught Place', 'Inner Circle', 28.6328, 77.2197, 'Central Delhi', 50)")
    test_conn.execute("INSERT INTO sightings VALUES (42, 'DL8CAF2381', 'CAM_01', 1700000000, '2023-11-14T22:13:20', 48.0, 0.98, 'Sedan', 'White', '[\"NORMAL\"]')")
    test_conn.commit()

    monkeypatch.setattr("backend.gemini_nl.get_db_connection", lambda: test_conn)
    return test_conn

@pytest.mark.asyncio
async def test_grounded_response_schema_on_match(mock_db_with_known_vehicle):
    res = await execute_nl_to_sql("Where was DL8CAF2381 last seen?")
    assert res["success"] is True
    assert res["found"] is True
    assert res["requested_plate"] == "DL8CAF2381"
    assert res["matched_plate"] == "DL8CAF2381"
    assert res["records_matched"] == 1
    assert 42 in res["sighting_ids_used"]
    assert "CAM_01" in res["camera_ids_used"]
    assert len(res["source_timestamps"]) == 1
    assert res["search_time_range"]["earliest"] is not None

@pytest.mark.asyncio
async def test_grounded_response_schema_on_unknown(mock_db_with_known_vehicle):
    res = await execute_nl_to_sql("Where was QA-DEMO-UNKNOWN last seen?")
    assert res["success"] is True
    assert res["found"] is False
    assert res["requested_plate"] == "QA-DEMO-UNKNOWN"
    assert res["matched_plate"] is None
    assert res["records_matched"] == 0
    assert res["sighting_ids_used"] == []
    assert res["camera_ids_used"] == []
    assert res["source_timestamps"] == []
    assert "No sightings found" in res["message"]
