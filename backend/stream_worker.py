import asyncio
import logging
import time
import random
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("crusaders.stream_worker")

# Simulator scenarios that loop realistically through Delhi's road network
SIMULATOR_SCENARIOS = [
    {
        "name": "Consecutive Speed Violation (Corridor Travel)",
        "plate": "AP 10 AR 0658",
        "cam": "CAM_01",
        "next_cam": "CAM_02",
        "transit_delay": 5, # seconds between simulated corridor arrival
        "vehicle_type": "Hatchback",
        "color": "Red",
        "make_model": "Hyundai Grand i10",
        "speed": 86.0,
        "forced_speed": 86.0
    },
    {
        "name": "Ghost Plate Clone Teleportation",
        "plate": "DL 8C AB 9110",
        "cam": "CAM_01",
        "next_cam": "CAM_07",
        "transit_delay": 2, # physically impossible 18.2 km in 2s
        "vehicle_type": "Sedan",
        "color": "Silver",
        "make_model": "Honda City",
        "speed": 72.0,
        "forced_speed": 72.0
    },
    {
        "name": "VIP Suspicious Convoy Formation",
        "plate": "DL 1C AA 9999",
        "cam": "CAM_03",
        "next_cam": "CAM_04",
        "transit_delay": 4,
        "vehicle_type": "SUV",
        "color": "White",
        "make_model": "Mahindra Scorpio-N",
        "speed": 62.0,
        "forced_speed": 62.0
    },
    {
        "name": "High Priority Watchlist Match",
        "plate": "DL 1C WX 0007",
        "cam": "CAM_06",
        "next_cam": "CAM_09",
        "transit_delay": 6,
        "vehicle_type": "SUV",
        "color": "Dark Grey",
        "make_model": "Toyota Fortuner",
        "speed": 78.5,
        "forced_speed": 78.5
    }
]

class MultiJunctionStreamWorker:
    def __init__(self):
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        self.scan_interval = 7.0 # seconds
        self.total_scans = 0
        self.total_sightings_injected = 0
        self.last_scan_time = None
        self.active_streams_count = 12
        self.current_scenario_idx = 0

    def get_status(self) -> Dict[str, Any]:
        return {
            "simulator_running": self.is_running,
            "scan_interval_sec": self.scan_interval,
            "total_scans_performed": self.total_scans,
            "total_sightings_generated": self.total_sightings_injected,
            "last_scan_iso": self.last_scan_time,
            "active_junction_feeds": 12,
            "stream_protocol": "Simulated RTSP over TCP/HLS",
            "rtsp_base_url": "rtsp://127.0.0.1:8554"
        }

    async def start(self, process_sighting_fn):
        if self.is_running:
            return
        self.is_running = True
        self.task = asyncio.create_task(self._run_loop(process_sighting_fn))
        logger.info("MultiJunction CCTV Stream Worker started.")

    async def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None
        logger.info("MultiJunction CCTV Stream Worker stopped.")

    async def _run_loop(self, process_sighting_fn):
        while self.is_running:
            try:
                await asyncio.sleep(self.scan_interval)
                await self.execute_scan_cycle(process_sighting_fn)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in stream simulator scan cycle: {e}")
                await asyncio.sleep(3.0)

    async def execute_scan_cycle(self, process_sighting_fn) -> Optional[Dict[str, Any]]:
        self.total_scans += 1
        self.last_scan_time = datetime.now().isoformat()
        
        scenario = SIMULATOR_SCENARIOS[self.current_scenario_idx % len(SIMULATOR_SCENARIOS)]
        self.current_scenario_idx += 1

        cam_id = scenario["cam"]
        plate = scenario["plate"]
        v_type = f"{scenario['make_model']} ({scenario['vehicle_type']})"
        color = scenario["color"]
        forced_speed = scenario.get("forced_speed", 65.0)

        # Ingest first camera sighting
        res1 = await process_sighting_fn(
            plate=plate,
            camera_id=cam_id,
            confidence=round(random.uniform(0.94, 0.99), 2),
            vehicle_type=v_type,
            color=color,
            forced_speed=forced_speed
        )
        self.total_sightings_injected += 1

        # Schedule consecutive arrival if defined
        next_cam = scenario.get("next_cam")
        transit_delay = scenario.get("transit_delay", 4)
        if next_cam and self.is_running:
            asyncio.create_task(self._delayed_next_sighting(
                process_sighting_fn,
                plate=plate,
                camera_id=next_cam,
                vehicle_type=v_type,
                color=color,
                delay=transit_delay,
                forced_speed=forced_speed + random.uniform(1.0, 5.0)
            ))

        return {
            "cycle": self.total_scans,
            "scenario": scenario["name"],
            "camera": cam_id,
            "plate": plate,
            "result": res1
        }

    async def _delayed_next_sighting(self, process_sighting_fn, plate, camera_id, vehicle_type, color, delay, forced_speed):
        await asyncio.sleep(delay)
        if not self.is_running:
            return
        try:
            await process_sighting_fn(
                plate=plate,
                camera_id=camera_id,
                confidence=round(random.uniform(0.95, 0.99), 2),
                vehicle_type=vehicle_type,
                color=color,
                forced_speed=forced_speed
            )
            self.total_sightings_injected += 1
        except Exception as e:
            logger.error(f"Error injecting consecutive sighting for {plate} at {camera_id}: {e}")

stream_worker = MultiJunctionStreamWorker()
