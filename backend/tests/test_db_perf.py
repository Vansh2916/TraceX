"""
Performance Benchmark Test for High-Frequency SQLite Writes.
"""
import time
import sqlite3
import pytest
from backend.db_optimization import apply_performance_pragmas

def test_wal_mode_batch_insert(temp_db):
    conn = sqlite3.connect(temp_db)
    apply_performance_pragmas(conn)
    cursor = conn.cursor()

    start_time = time.time()
    batch = [
        (f"DL{i:02d}AA{j:04d}", "CAM_01", 1700000000.0 + j, 0.95, "CLEAR")
        for i in range(5)
        for j in range(100)
    ]
    cursor.executemany("""
        INSERT INTO sightings (plate_number, camera_id, timestamp_sec, confidence, flag)
        VALUES (?, ?, ?, ?, ?)
    """, batch)
    conn.commit()
    elapsed = time.time() - start_time
    conn.close()

    assert len(batch) == 500
    assert elapsed < 0.5  # 500 records inserted in under 500ms
