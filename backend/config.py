"""
Centralized Configuration Module for TraceX ANPR Surveillance Platform.
Handles environment variables, default settings, and surveillance corridor constants.
"""
from dataclasses import dataclass, field
import os
from typing import Dict, Any, List

@dataclass
class Settings:
    # Application Info
    APP_NAME: str = "TraceX - City-Wide ANPR Intelligence"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: List[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ])

    # Database
    DB_PATH: str = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "crusaders.db"))
    SQLITE_TIMEOUT: float = 30.0

    # Surveillance Corridor Constants (Delhi Traffic Police Benchmarks)
    DEFAULT_SPEED_LIMIT_KMH: float = 50.0
    IMPOSSIBLE_SPEED_KMH: float = 140.0
    GHOST_DETECTION_TIME_MINUTES: int = 5
    CONVOY_WINDOW_SECONDS: int = 120
    CONVOY_MIN_SHARED_JUNCTIONS: int = 3
    ALIBI_TOLERANCE_KM: float = 2.5

    # CCTV Simulation Stream Rates
    RTSP_SIMULATOR_FPS: int = int(os.getenv("RTSP_SIMULATOR_FPS", "15"))
    SIMULATION_AUTO_START: bool = os.getenv("SIMULATION_AUTO_START", "True").lower() in ("true", "1")

    # AI & LLM Settings
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

_settings_instance = None

def get_settings() -> Settings:
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = Settings()
    return _settings_instance
