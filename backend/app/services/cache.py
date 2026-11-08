"""Redis-backed cache with an in-process fallback.

Production points REDIS_URL at ElastiCache (any Redis URL works). When
REDIS_URL is unset or Redis is unreachable, the cache falls back to a
small in-process TTL dict, so local dev and tests behave the same way,
just without sharing state across processes.

Cache failures never break a request: every operation degrades to a
miss / no-op and the caller falls through to the database.
"""

import json
import time
from typing import Any

from app.config import settings

_client = None
_next_retry = 0.0
_local: dict[str, tuple[float, str]] = {}


def _redis():
    global _client, _next_retry
    if _client is not None:
        return _client
    if not settings.REDIS_URL or time.time() < _next_retry:
        return None
    try:
        import redis

        client = redis.Redis.from_url(
            settings.REDIS_URL, socket_connect_timeout=2, decode_responses=True
        )
        client.ping()
        _client = client
    except Exception:
        # Don't hammer a down cache; retry at most every 30 seconds.
        _next_retry = time.time() + 30
    return _client


def get_json(key: str) -> Any | None:
    client = _redis()
    if client is not None:
        try:
            raw = client.get(key)
            return json.loads(raw) if raw is not None else None
        except Exception:
            return None
    entry = _local.get(key)
    if entry is None:
        return None
    expires_at, raw = entry
    if time.time() >= expires_at:
        _local.pop(key, None)
        return None
    return json.loads(raw)


def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    raw = json.dumps(value)
    client = _redis()
    if client is not None:
        try:
            client.set(key, raw, ex=ttl_seconds)
            return
        except Exception:
            pass
    _local[key] = (time.time() + ttl_seconds, raw)


def delete(key: str) -> None:
    client = _redis()
    if client is not None:
        try:
            client.delete(key)
        except Exception:
            pass
    _local.pop(key, None)


def reset_for_tests() -> None:
    """Drop the memoized client and local store (used by the test suite)."""
    global _client, _next_retry
    _client = None
    _next_retry = 0.0
    _local.clear()
