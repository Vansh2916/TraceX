"""
Security Headers and Rate Limiting Middleware for TraceX API.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
import time
from typing import Dict, Tuple

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

class SimpleRateLimiter:
    """In-memory sliding window rate limiter."""
    def __init__(self, requests_per_minute: int = 120):
        self.rate = requests_per_minute
        self.clients: Dict[str, list] = {}

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - 60.0
        timestamps = self.clients.get(client_ip, [])
        # prune old timestamps
        timestamps = [t for t in timestamps if t > window_start]
        if len(timestamps) >= self.rate:
            self.clients[client_ip] = timestamps
            return False
        timestamps.append(now)
        self.clients[client_ip] = timestamps
        return True
