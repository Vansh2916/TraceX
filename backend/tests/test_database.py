"""
Unit tests for Database Operations, Camera Seeding, and Sighting Queries.
"""
import sqlite3
import pytest

def test_insert_and_query_sighting(temp_db):
    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO sightings (plate_number, camera_id, timestamp_sec, confidence, flag)
        VALUES (?, ?, ?, ?, ?)
    """, ("DL01AB1234", "CAM_01", 1700000000.0, 0.98, "CLEAR"))
    conn.commit()

    cursor.execute("SELECT plate_number, camera_id, confidence FROM sightings WHERE plate_number = ?", ("DL01AB1234",))
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    assert row[0] == "DL01AB1234"
    assert row[1] == "CAM_01"
    assert row[2] == 0.98

def test_watchlist_hit(temp_db):
    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()

    cursor.execute("INSERT INTO watchlist (plate_number, reason, severity) VALUES (?, ?, ?)",
                   ("DL09XY9999", "Stolen Vehicle Bolero", "CRITICAL"))
    conn.commit()

    cursor.execute("SELECT reason, severity FROM watchlist WHERE plate_number = ?", ("DL09XY9999",))
    res = cursor.fetchone()
    conn.close()

    assert res is not None
    assert res[0] == "Stolen Vehicle Bolero"
    assert res[1] == "CRITICAL"
