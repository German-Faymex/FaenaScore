"""Clerk JWT verification using JWKS (RS256)."""

import time

import httpx
import structlog
from jose import jwt, JWTError

from app.config import settings

logger = structlog.get_logger()

_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0
_JWKS_CACHE_TTL = 3600


async def _fetch_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at

    now = time.time()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_CACHE_TTL:
        return _jwks_cache

    async with httpx.AsyncClient() as client:
        resp = await client.get(settings.CLERK_JWKS_URL)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = now
        logger.info("Fetched JWKS from Clerk", url=settings.CLERK_JWKS_URL)
        return _jwks_cache


def _invalidate_jwks_cache() -> None:
    global _jwks_cache, _jwks_fetched_at
    _jwks_cache = None
    _jwks_fetched_at = 0


async def verify_clerk_token(token: str) -> dict:
    jwks = await _fetch_jwks()

    options = {"verify_aud": bool(settings.CLERK_AUDIENCE)}
    audience = settings.CLERK_AUDIENCE or None

    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER or None,
            audience=audience,
            options=options,
        )
        return payload
    except JWTError:
        _invalidate_jwks_cache()
        jwks = await _fetch_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER or None,
            audience=audience,
            options=options,
        )
        return payload
