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
