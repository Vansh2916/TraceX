"""
Database Performance and PRAGMA Optimization Module for SQLite.
Configures WAL (Write-Ahead Logging), cache sizes, and memory-mapped I/O.
"""
import sqlite3

def apply_performance_pragmas(conn: sqlite3.Connection):
    """Applies optimal SQLite settings for high-throughput ANPR streaming."""
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA cache_size=-64000;")  # 64MB memory cache
    cursor.execute("PRAGMA temp_store=MEMORY;")
    cursor.execute("PRAGMA busy_timeout=5000;")  # 5 second timeout on locks
    conn.commit()

def get_optimized_connection(db_path: str) -> sqlite3.Connection:
    """Returns a connection configured with optimized concurrency settings."""
    conn = sqlite3.connect(db_path, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    apply_performance_pragmas(conn)
    return conn
