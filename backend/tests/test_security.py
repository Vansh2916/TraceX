"""
Unit tests for Security Middleware and Rate Limiter.
"""
import pytest
from backend.middleware import SimpleRateLimiter

def test_rate_limiter_allows_under_quota():
    limiter = SimpleRateLimiter(requests_per_minute=5)
    ip = "192.168.1.100"
    for _ in range(5):
        assert limiter.is_allowed(ip) is True

def test_rate_limiter_blocks_over_quota():
    limiter = SimpleRateLimiter(requests_per_minute=3)
    ip = "10.0.0.1"
    assert limiter.is_allowed(ip) is True
    assert limiter.is_allowed(ip) is True
    assert limiter.is_allowed(ip) is True
    # 4th request must be rejected
    assert limiter.is_allowed(ip) is False
