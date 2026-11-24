"""
Tests for Requirement 3: Canonical Camera Registry.
"""
import pytest
from backend.camera_registry import camera_registry, CameraModel

def test_canonical_cameras_registry_loaded():
    cameras = camera_registry.get_all()
    assert len(cameras) >= 12
    ids = [c.id for c in cameras]
    assert len(ids) == len(set(ids)), "Camera IDs must be unique"
    assert "CAM_01" in ids
    assert "CAM_02" in ids

def test_camera_coordinate_and_speed_validation():
    for cam in camera_registry.get_all():
        assert -90.0 <= cam.lat <= 90.0, f"Invalid lat for {cam.id}"
        assert -180.0 <= cam.lon <= 180.0, f"Invalid lon for {cam.id}"
        assert 0.0 < cam.speed_limit <= 200.0, f"Invalid speed limit for {cam.id}"
        assert bool(cam.media_source), f"Missing media source for {cam.id}"
        assert isinstance(cam.is_active, bool)

def test_prevent_duplicate_camera_id_registration():
    dup_cam = CameraModel(
        id="CAM_01",
        name="Duplicate Connaught Place",
        lat=28.6328,
        lon=77.2197,
        speed_limit=50.0,
        media_source="/test/feed.mp4"
    )
    with pytest.raises(ValueError, match="already exists"):
        camera_registry.register(dup_cam, overwrite=False)

def test_controlled_update_camera():
    updated = camera_registry.update("CAM_01", {"speed_limit": 55.0})
    assert updated is not None
    assert updated.speed_limit == 55.0
    # Reset back to 50
    camera_registry.update("CAM_01", {"speed_limit": 50.0})
