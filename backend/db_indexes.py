"""
Schema Indexing Definitions for TraceX Database.
Ensures O(log N) lookups for time-series ANPR queries.
"""
import sqlite3

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_sightings_plate_ts ON sightings(plate_number, timestamp_sec);",
    "CREATE INDEX IF NOT EXISTS idx_sightings_cam_ts ON sightings(camera_id, timestamp_sec);",
    "CREATE INDEX IF NOT EXISTS idx_alerts_ts ON alerts(timestamp_sec DESC);",
    "CREATE INDEX IF NOT EXISTS idx_alerts_plate ON alerts(plate_number);",
    "CREATE INDEX IF NOT EXISTS idx_watchlist_plate ON watchlist(plate_number);",
]

def ensure_indexes(conn: sqlite3.Connection):
    """Executes index creations if not already present."""
    cursor = conn.cursor()
    for stmt in INDEX_STATEMENTS:
        try:
            cursor.execute(stmt)
        except sqlite3.OperationalError:
            pass  # table might not exist yet
    conn.commit()
