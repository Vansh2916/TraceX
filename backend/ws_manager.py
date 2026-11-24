"""
Resilient WebSocket Connection Manager with Heartbeat and Channel Subscriptions.
"""
import asyncio
from typing import List, Dict, Set, Any
import json
import time

class EnhancedConnectionManager:
    def __init__(self):
        self.active_connections: List[Any] = []
        self.channel_subscriptions: Dict[str, Set[Any]] = {}
        self.last_seen: Dict[Any, float] = {}

    async def connect(self, websocket: Any):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.last_seen[websocket] = time.time()

    def disconnect(self, websocket: Any):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.last_seen:
            del self.last_seen[websocket]
        for channel, subscribers in self.channel_subscriptions.items():
            subscribers.discard(websocket)

    def record_heartbeat(self, websocket: Any):
        self.last_seen[websocket] = time.time()

    async def broadcast(self, message: Dict[str, Any]):
        payload = json.dumps(message)
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)
