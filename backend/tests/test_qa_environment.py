"""
Tests for Requirement 4: Isolated QA Deployment.
"""
import os
import sqlite3
from backend.qa_config import QA_DB_PATH, init_qa_database, DETERMINISTIC_QA_CAMERAS, DETERMINISTIC_QA_SIGHTINGS

def test_qa_database_isolated_creation_and_seeding(tmp_path):
    test_db = str(tmp_path / "test_qa_isolated.db")
    conn = init_qa_database(test_db)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM cameras")
    assert cur.fetchone()[0] == len(DETERMINISTIC_QA_CAMERAS)

    cur.execute("SELECT COUNT(*) FROM sightings")
    assert cur.fetchone()[0] == len(DETERMINISTIC_QA_SIGHTINGS)

    # Check deterministic record
    cur.execute("SELECT plate, speed_kmh FROM sightings WHERE plate = 'QA-OVERSPEED-99'")
    row = cur.fetchone()
    assert row is not None
    assert row[0] == "QA-OVERSPEED-99"
    assert row[1] == 92.0

    conn.close()
    if os.path.exists(test_db):
        os.remove(test_db)
