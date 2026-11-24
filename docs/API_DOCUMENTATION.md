# TraceX API Documentation

## Base URL
- Development: `http://localhost:8000`
- Production: `https://tracex.delhipolice.gov.in`

---

## 1. CCTV & Camera Network

### `GET /api/cameras`
Returns all 12 registered Delhi traffic junctions with coordinates and speed limits.

**Response `200 OK`:**
```json
[
  {
    "id": "CAM_01",
    "name": "Connaught Place",
    "corridor": "Outer Circle / Barakhamba Rd",
    "lat": 28.6328,
    "lon": 77.2197,
    "speed_limit": 50.0,
    "status": "ONLINE"
  }
]
```

---

## 2. ANPR Sightings & Ingestion

### `POST /api/sightings`
Ingests an ANPR license plate detection record from camera stream workers.

**Request Body:**
```json
{
  "plate_number": "DL01AB1234",
  "camera_id": "CAM_01",
  "timestamp_sec": 1700000000.0,
  "confidence": 0.98
}
```

---

## 3. Alibi Verification

### `POST /api/alibi`
Calculates distance discrepancy between a suspect's claimed alibi and actual ANPR sightings.
