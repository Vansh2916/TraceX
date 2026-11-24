"""
Pytest configuration and test fixtures for TraceX Backend.
"""
import pytest
import sqlite3
import os
import tempfile

@pytest.fixture
def temp_db():
    """Provides a clean temporary SQLite database for test execution."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    
    conn = sqlite3.connect(path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE cameras (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            speed_limit REAL DEFAULT 50.0
        )
    """)
    cursor.execute("""
        CREATE TABLE sightings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate_number TEXT NOT NULL,
            camera_id TEXT NOT NULL,
            timestamp_sec REAL NOT NULL,
            confidence REAL DEFAULT 0.95,
            flag TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE watchlist (
            plate_number TEXT PRIMARY KEY,
            reason TEXT NOT NULL,
            severity TEXT DEFAULT 'HIGH'
        )
    """)
    conn.commit()
    conn.close()

    yield path

    if os.path.exists(path):
        os.remove(path)

@pytest.fixture
def sample_cameras():
    return [
        {"id": "CAM_01", "name": "Connaught Place", "lat": 28.6328, "lon": 77.2197, "speed_limit": 50.0},
        {"id": "CAM_02", "name": "India Gate", "lat": 28.6129, "lon": 77.2295, "speed_limit": 50.0},
        {"id": "CAM_03", "name": "ITO Junction", "lat": 28.6289, "lon": 77.2410, "speed_limit": 50.0},
    ]
