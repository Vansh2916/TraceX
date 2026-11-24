"""
authoritative single source of truth for Camera Registry.
Every camera definition, coordinate, speed limit, and media source is validated and registered here.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator
import logging

logger = logging.getLogger("crusaders.camera_registry")

class CameraModel(BaseModel):
    id: str = Field(..., description="Unique camera ID, e.g. CAM_01")
    name: str = Field(..., description="Descriptive camera location name")
    landmark: Optional[str] = Field(default="", description="Key intersection or landmark")
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude coordinate")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude coordinate")
    speed_limit: float = Field(..., gt=0.0, le=200.0, description="Speed limit in km/h")
    media_source: str = Field(default="", description="Media source identifier / stream endpoint")
    is_active: bool = Field(default=True, description="Active/inactive status")
    zone: str = Field(default="Delhi NCR", description="Administrative zone")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom camera metadata")

    @field_validator("id")
    def validate_id(cls, v):
        v = v.strip().upper()
        if not v:
            raise ValueError("Camera ID cannot be empty")
        return v

CANONICAL_CAMERAS: Dict[str, CameraModel] = {
    "CAM_01": CameraModel(
        id="CAM_01",
        name="Connaught Place",
        landmark="Outer Circle (Barakhamba Rd Entry)",
        lat=28.6328,
        lon=77.2197,
        zone="Central Delhi",
        speed_limit=50.0,
        media_source="/footage/city-junction.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_02": CameraModel(
        id="CAM_02",
        name="India Gate C-Hexagon",
        landmark="Kartavya Path / Rajpath Crossing",
        lat=28.6129,
        lon=77.2295,
        zone="New Delhi VIP Zone",
        speed_limit=60.0,
        media_source="/footage/consecutive_cam02_indiagate.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_03": CameraModel(
        id="CAM_03",
        name="ITO Junction",
        landmark="Vikas Marg & Bahadur Shah Zafar Marg",
        lat=28.6289,
        lon=77.2410,
        zone="Central / Trans-Yamuna Corridor",
        speed_limit=50.0,
        media_source="/footage/consecutive_cam03_ito.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_04": CameraModel(
        id="CAM_04",
        name="Kashmere Gate ISBT",
        landmark="Ring Road / Old Delhi Gate",
        lat=28.6665,
        lon=77.2332,
        zone="North Delhi Inter-State Hub",
        speed_limit=60.0,
        media_source="/footage/night-highway.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_05": CameraModel(
        id="CAM_05",
        name="AIIMS Ring Road",
        landmark="Sri Aurobindo Marg Underpass",
        lat=28.5672,
        lon=77.2100,
        zone="South Delhi Medical Corridor",
        speed_limit=50.0,
        media_source="/footage/city-junction.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_06": CameraModel(
        id="CAM_06",
        name="Dhaula Kuan NH-48",
        landmark="Mahatma Gandhi Marg Interchange",
        lat=28.5921,
        lon=77.1616,
        zone="South West Delhi Bottleneck",
        speed_limit=70.0,
        media_source="/footage/night-highway.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_07": CameraModel(
        id="CAM_07",
        name="Rajpath Rd (Janpath)",
        landmark="National Museum / Kartavya Path South",
        lat=28.6180,
        lon=77.2180,
        zone="New Delhi Core",
        speed_limit=50.0,
        media_source="/footage/consecutive_cam02_indiagate.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_08": CameraModel(
        id="CAM_08",
        name="Ashram Chowk Underpass",
        landmark="Mathura Road & Ring Road Junction",
        lat=28.5707,
        lon=77.2588,
        zone="South East Delhi Gateway",
        speed_limit=50.0,
        media_source="/footage/city-junction.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_09": CameraModel(
        id="CAM_09",
        name="Moti Bagh Junction",
        landmark="Ring Road & Shanti Path",
        lat=28.5833,
        lon=77.1744,
        zone="Diplomatic Enclave / South Delhi",
        speed_limit=60.0,
        media_source="/footage/night-highway.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_10": CameraModel(
        id="CAM_10",
        name="Lajpat Nagar Flyover",
        landmark="Ring Road (Near Central Market)",
        lat=28.5677,
        lon=77.2433,
        zone="South Delhi Commercial",
        speed_limit=50.0,
        media_source="/footage/city-junction.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_11": CameraModel(
        id="CAM_11",
        name="Karol Bagh Metro",
        landmark="Pusa Road & Arya Samaj Road",
        lat=28.6515,
        lon=77.1905,
        zone="West-Central Delhi",
        speed_limit=40.0,
        media_source="/footage/night-highway.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
    "CAM_12": CameraModel(
        id="CAM_12",
        name="Sarai Kale Khan RRTS",
        landmark="Ring Road / Hazrat Nizamuddin Station",
        lat=28.5885,
        lon=77.2550,
        zone="South East Inter-Modal Transit",
        speed_limit=50.0,
        media_source="/footage/consecutive_cam03_ito.mp4",
        is_active=True,
        metadata={"resolution": "1080p", "fps": 25}
    ),
}

class CameraRegistry:
    def __init__(self):
        self._cameras: Dict[str, CameraModel] = dict(CANONICAL_CAMERAS)

    def get_all(self, active_only: bool = False) -> List[CameraModel]:
        if active_only:
            return [cam for cam in self._cameras.values() if cam.is_active]
        return list(self._cameras.values())

    def get_dict_map(self) -> Dict[str, Dict[str, Any]]:
        return {cid: cam.model_dump() for cid, cam in self._cameras.items()}

    def get(self, camera_id: str) -> Optional[CameraModel]:
        return self._cameras.get(camera_id.strip().upper())

    def register(self, cam: CameraModel, overwrite: bool = False) -> CameraModel:
        cid = cam.id.strip().upper()
        if cid in self._cameras and not overwrite:
            raise ValueError(f"Camera with ID '{cid}' already exists in registry.")
        self._cameras[cid] = cam
        return cam

    def update(self, camera_id: str, updates: Dict[str, Any]) -> Optional[CameraModel]:
        cid = camera_id.strip().upper()
        if cid not in self._cameras:
            return None
        existing = self._cameras[cid].model_dump()
        existing.update(updates)
        updated_cam = CameraModel(**existing)
        self._cameras[cid] = updated_cam
        return updated_cam

camera_registry = CameraRegistry()
