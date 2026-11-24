"""
authoritative Persistent Settings Manager for TraceX.
Handles persistent storage of system configuration (OCR confidence, speed tolerance, ghost window),
displaying currently saved vs applied values, with explicit confirmation on successful backend application.
"""
import os
import json
from typing import Dict, Any
from pydantic import BaseModel, Field

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "system_settings.json")

class SystemSettingsModel(BaseModel):
    ocr_confidence_threshold: int = Field(default=85, ge=50, le=99)
    speed_tolerance_kmh: int = Field(default=10, ge=0, le=50)
    ghost_delta_sec: int = Field(default=30, ge=5, le=300)
    retention_days: int = Field(default=90, ge=7, le=365)
    default_role_access: str = Field(default="OPERATOR", description="ADMIN, OPERATOR, VIEWER")

class SettingsManager:
    def __init__(self, filepath: str = SETTINGS_FILE):
        self.filepath = filepath
        self._saved_settings: SystemSettingsModel = self._load()
        self._applied_settings: SystemSettingsModel = SystemSettingsModel(**self._saved_settings.model_dump())

    def _load(self) -> SystemSettingsModel:
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return SystemSettingsModel(**data)
            except Exception:
                pass
        return SystemSettingsModel()

    def get_status(self) -> Dict[str, Any]:
        return {
            "saved": self._saved_settings.model_dump(),
            "applied": self._applied_settings.model_dump(),
            "is_synced": self._saved_settings.model_dump() == self._applied_settings.model_dump()
        }

    def save_and_apply(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        new_settings = SystemSettingsModel(**{**self._saved_settings.model_dump(), **updates})
        # Save to disk
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(new_settings.model_dump(), f, indent=2)
        self._saved_settings = new_settings
        # Apply to running backend state
        self._applied_settings = SystemSettingsModel(**new_settings.model_dump())
        return self.get_status()

settings_manager = SettingsManager()
