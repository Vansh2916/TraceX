"""
Configuration Helper Utilities for TraceX.
Provides convenience wrappers for accessing active runtime parameters.
"""
try:
    from backend.config import get_settings
except ImportError:
    from config import get_settings

def get_database_path() -> str:
    """Returns absolute path to SQLite database from configuration."""
    return get_settings().DB_PATH

def get_camera_speed_limit(node_id: str, default: float = 50.0) -> float:
    """Returns authorized corridor speed limit for node."""
    settings = get_settings()
    return default or settings.DEFAULT_SPEED_LIMIT_KMH

def is_debug_mode() -> bool:
    """Returns True if debug mode is active."""
    return get_settings().DEBUG
