"""
Async Test Suite for EnhancedConnectionManager.
"""
import pytest
from unittest.mock import AsyncMock
from backend.ws_manager import EnhancedConnectionManager

@pytest.mark.asyncio
async def test_websocket_connect_and_broadcast():
    manager = EnhancedConnectionManager()
    mock_ws = AsyncMock()

    await manager.connect(mock_ws)
    assert len(manager.active_connections) == 1

    await manager.broadcast({"type": "ALERT", "plate": "DL01AA1111"})
    mock_ws.send_text.assert_called_once()

    manager.disconnect(mock_ws)
    assert len(manager.active_connections) == 0

@pytest.mark.asyncio
async def test_channel_subscription_filtering():
    manager = EnhancedConnectionManager()
    ws1 = AsyncMock()
    ws2 = AsyncMock()

    await manager.connect(ws1)
    await manager.connect(ws2)

    manager.subscribe_channel(ws1, "CAM_01")

    await manager.broadcast_to_channel("CAM_01", {"type": "SIGHTING", "cam": "CAM_01"})
    ws1.send_text.assert_called_once()
    ws2.send_text.assert_not_called()
