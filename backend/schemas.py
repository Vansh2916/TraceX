"""
Pydantic Request and Response Schemas for TraceX API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CameraBase(BaseModel):
    id: str = Field(..., description="Camera identifier, e.g. CAM_01")
    name: str = Field(..., description="Junction name / location")
    lat: float = Field(..., description="Latitude coordinate")
    lon: float = Field(..., description="Longitude coordinate")
    speed_limit: float = Field(default=50.0, description="Speed limit in km/h")

class CameraResponse(CameraBase):
    status: Optional[str] = "ONLINE"
    active_feed_url: Optional[str] = None

class SightingCreate(BaseModel):
    plate_number: str = Field(..., min_length=4, max_length=15, description="Vehicle license plate")
    camera_id: str = Field(..., description="Camera ID that detected plate")
    timestamp_sec: Optional[float] = Field(default=None, description="Detection epoch timestamp in seconds")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    flag: Optional[str] = Field(default=None, description="Detection tag or flag")

class SightingResponse(SightingCreate):
    id: int
    camera_name: Optional[str] = None
    created_at: Optional[str] = None

class WatchlistEntry(BaseModel):
    plate_number: str = Field(..., description="Target license plate")
    reason: str = Field(..., description="Reason for surveillance / alert flag")
    severity: str = Field(default="HIGH", description="LOW, MEDIUM, HIGH, CRITICAL")
    registered_owner: Optional[str] = None
    vehicle_model: Optional[str] = None

class AlertRecord(BaseModel):
    id: Optional[int] = None
    alert_type: str = Field(..., description="e.g. WATCHLIST_MATCH, SPEEDING, GHOST_VEHICLE, CONVOY")
    plate_number: str
    camera_id: str
    timestamp_sec: float
    description: str
    severity: str = "HIGH"

class AlibiVerificationRequest(BaseModel):
    plate_number: str
    claimed_location: str
    claimed_lat: float
    claimed_lon: float
    claimed_time_sec: float
    time_window_minutes: int = 30
