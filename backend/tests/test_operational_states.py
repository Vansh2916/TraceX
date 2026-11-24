"""
Tests for Requirement 2: Explicit Operational States (LIVE, DEMO, DEGRADED, OFFLINE).
"""
import time

def compute_operational_state(
    backend_reachable: bool,
    ws_connected: bool,
    is_demo_data: bool,
    last_update_ts: float | None,
    critical_services_ok: bool,
    freshness_threshold_sec: float = 60.0,
    current_time_sec: float | None = None
) -> str:
    """
    State evaluation function:
    LIVE: Backend is reachable, ingestion functioning, and latest successful update is fresh.
    DEMO: Application is displaying clearly identified demonstration or synthetic data.
    DEGRADED: Reachable, but one or more critical services are unavailable or stale.
    OFFLINE: Backend or required application services cannot be reached.
    """
    if not backend_reachable:
        return "OFFLINE"
    
    if is_demo_data:
        return "DEMO"

    if not critical_services_ok or not ws_connected:
        return "DEGRADED"

    now = current_time_sec if current_time_sec is not None else time.time()
    if last_update_ts is None:
        return "DEGRADED"

    if (now - last_update_ts) > freshness_threshold_sec:
        return "DEGRADED"

    return "LIVE"

def test_operational_state_live():
    now = 1700000000
    state = compute_operational_state(
        backend_reachable=True,
        ws_connected=True,
        is_demo_data=False,
        last_update_ts=now - 10,
        critical_services_ok=True,
        freshness_threshold_sec=60.0,
        current_time_sec=now
    )
    assert state == "LIVE"

def test_operational_state_demo():
    state = compute_operational_state(
        backend_reachable=True,
        ws_connected=False,
        is_demo_data=True,
        last_update_ts=None,
        critical_services_ok=True
    )
    assert state == "DEMO"

def test_operational_state_degraded_stale():
    now = 1700000000
    state = compute_operational_state(
        backend_reachable=True,
        ws_connected=True,
        is_demo_data=False,
        last_update_ts=now - 300, # 5 mins stale (> 60s)
        critical_services_ok=True,
        freshness_threshold_sec=60.0,
        current_time_sec=now
    )
    assert state == "DEGRADED"

def test_operational_state_degraded_service_down():
    now = 1700000000
    state = compute_operational_state(
        backend_reachable=True,
        ws_connected=False, # WS feed disconnected
        is_demo_data=False,
        last_update_ts=now - 5,
        critical_services_ok=False,
        current_time_sec=now
    )
    assert state == "DEGRADED"

def test_operational_state_offline():
    state = compute_operational_state(
        backend_reachable=False,
        ws_connected=False,
        is_demo_data=False,
        last_update_ts=None,
        critical_services_ok=False
    )
    assert state == "OFFLINE"
