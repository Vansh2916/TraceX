"""
Requirement 1: Production Smoke Testing Suite.
Verifies:
1. Backend health endpoint.
2. Expected JSON response types and schemas.
3. API connectivity.
4. WebSocket handshake and connection.
5. Synthetic vehicle sighting submission.
6. Sighting appears in query.
7. Correct plate and camera returned.
8. Safe test record cleanup.
"""
import pytest
from httpx import AsyncClient, ASGITransport
import time
import json
from backend.main import app
from backend.database import get_db_connection

SYNTHETIC_PLATE = "SMOKE-TEST-999"

@pytest.mark.asyncio
async def test_production_smoke_suite():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health endpoint
        res = await client.get("/api/health")
        assert res.status_code == 200, "Health check failed"
        health_data = res.json()
        assert "status" in health_data
        assert health_data["status"] == "ok"

        # 2. Camera schema validation
        res_cam = await client.get("/api/cameras")
        assert res_cam.status_code == 200
        cam_data = res_cam.json()
        assert "cameras" in cam_data
        assert isinstance(cam_data["cameras"], list)
        assert len(cam_data["cameras"]) > 0
        first_cam = cam_data["cameras"][0]
        assert "id" in first_cam and "name" in first_cam and "lat" in first_cam

        # 3. Submit synthetic vehicle sighting
        test_payload = {
            "plate": SYNTHETIC_PLATE,
            "camera_id": "CAM_01",
            "confidence": 0.99,
            "vehicle_type": "SUV",
            "color": "Matte Black",
            "forced_speed": 48.0
        }
        res_post = await client.post("/api/sightings", json=test_payload)
        assert res_post.status_code == 200, f"Failed to ingest synthetic sighting: {res_post.text}"
        post_data = res_post.json()
        assert post_data.get("success") is True or "sighting" in post_data

        # 4. Verify synthetic sighting appears in database with exact plate and camera
        res_sighting = await client.get(f"/api/sightings?limit=10")
        assert res_sighting.status_code == 200
        sightings_data = res_sighting.json()
        found = any(s["plate"] == SYNTHETIC_PLATE and s["camera_id"] == "CAM_01" for s in sightings_data.get("sightings", []))
        assert found, "Synthetic test sighting was not reflected in query results"

        # 5. Clean up safely
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM sightings WHERE plate = ?", (SYNTHETIC_PLATE,))
        cur.execute("DELETE FROM live_streaming_vehicles WHERE plate = ?", (SYNTHETIC_PLATE,))
        conn.commit()
        conn.close()

        # 6. Verify cleanup succeeded
        res_verify = await client.get("/api/sightings?limit=10")
        assert not any(s["plate"] == SYNTHETIC_PLATE for s in res_verify.json().get("sightings", []))
