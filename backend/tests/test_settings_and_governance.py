"""
Tests for Requirement 7 (Persistent Settings) and Requirement 8 (Security & Governance).
"""
import os
import time
from backend.settings_manager import SettingsManager, SystemSettingsModel
from backend.security_governance import record_audit_log, AuditLogEntry, check_permission, enforce_data_retention
from backend.database import get_db_connection

def test_persistent_settings_lifecycle(tmp_path):
    temp_file = str(tmp_path / "test_settings.json")
    mgr = SettingsManager(filepath=temp_file)
    status = mgr.get_status()
    assert status["is_synced"] is True

    # Update settings
    updated = mgr.save_and_apply({"ocr_confidence_threshold": 92, "speed_tolerance_kmh": 15})
    assert updated["saved"]["ocr_confidence_threshold"] == 92
    assert updated["applied"]["ocr_confidence_threshold"] == 92
    assert updated["is_synced"] is True

    # Verify persistent reload
    mgr2 = SettingsManager(filepath=temp_file)
    assert mgr2.get_status()["saved"]["ocr_confidence_threshold"] == 92

def test_rbac_permissions():
    assert check_permission("ADMIN", "DELETE_RECORDS") is True
    assert check_permission("OPERATOR", "READ_SIGHTINGS") is True
    assert check_permission("OPERATOR", "DELETE_RECORDS") is False
    assert check_permission("VIEWER", "READ_SIGHTINGS") is True
    assert check_permission("VIEWER", "INGEST_SIGHTING") is False

def test_audit_logging_and_retention():
    # 1. Audit log write
    entry = AuditLogEntry(
        user_identity="operator_01",
        role="OPERATOR",
        action="VERIFY_ALIBI",
        resource="DL8CAF2381",
        status="SUCCESS",
        details="Tested consistent movement"
    )
    log_id = record_audit_log(entry)
    assert log_id > 0

    # 2. Test retention cleanup on dummy past record
    conn = get_db_connection()
    cur = conn.cursor()
    old_time = time.time() - (100 * 86400) # 100 days ago
    cur.execute("""
        INSERT INTO sightings (plate, camera_id, timestamp_sec, iso_time, speed_kmh, confidence, flags)
        VALUES ('OLD-RETENTION-TEST', 'CAM_01', ?, '2023-01-01', 50.0, 0.95, '["NORMAL"]')
    """, (old_time,))
    conn.commit()
    conn.close()

    deleted = enforce_data_retention(retention_days=90)
    assert deleted >= 1
