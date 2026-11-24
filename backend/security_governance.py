"""
Requirement 8: Security and Data Governance.
Implements Role-Based Access Control (Admin, Operator, Read-only Viewer),
audit logging (identity, action, timestamp, status), and retention policy enforcement.
"""
import os
import sqlite3
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

class AuditLogEntry(BaseModel):
    user_identity: str
    role: str
    action: str
    resource: str
    status: str
    details: Optional[str] = ""

def init_audit_tables():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_identity TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            resource TEXT NOT NULL,
            timestamp_sec REAL NOT NULL,
            iso_time TEXT NOT NULL,
            status TEXT NOT NULL,
            details TEXT
        )
    """)
    conn.commit()
    conn.close()

init_audit_tables()

def record_audit_log(entry: AuditLogEntry) -> int:
    conn = get_db_connection()
    cur = conn.cursor()
    now_sec = time.time()
    iso = datetime.fromtimestamp(now_sec).isoformat()
    cur.execute("""
        INSERT INTO audit_logs (user_identity, role, action, resource, timestamp_sec, iso_time, status, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (entry.user_identity, entry.role, entry.action, entry.resource, now_sec, iso, entry.status, entry.details))
    lid = cur.lastrowid
    conn.commit()
    conn.close()
    return lid

def check_permission(role: str, action: str) -> bool:
    """
    ADMIN: All actions permitted (read, write, delete, configure).
    OPERATOR: Read, manual ingest, trigger simulations, verify alibi.
    VIEWER: Strictly read-only queries.
    """
    r = role.strip().upper()
    act = action.strip().upper()

    if r == "ADMIN":
        return True
    if r == "OPERATOR":
        return act not in ("DELETE_RECORDS", "PURGE_DATA", "CHANGE_ADMIN_SETTINGS")
    if r == "VIEWER":
        return act in ("READ_CAMERAS", "READ_SIGHTINGS", "READ_MAP", "READ_ANALYTICS")
    return False

def enforce_data_retention(retention_days: int) -> int:
    """Purges vehicle sightings older than retention_days."""
    conn = get_db_connection()
    cur = conn.cursor()
    cutoff = time.time() - (retention_days * 86400)
    cur.execute("DELETE FROM sightings WHERE timestamp_sec < ?", (cutoff,))
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    return deleted
