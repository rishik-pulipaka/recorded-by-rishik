from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from cachetools import TTLCache
from sqlmodel import Session, select
from datetime import datetime, timezone
from app.db import get_session
from app.config import settings

security = HTTPBearer()

# Cache JWKS for 10 minutes to avoid hitting Clerk on every request
_jwks_cache: TTLCache = TTLCache(maxsize=1, ttl=600)


async def _get_jwks() -> dict:
    cached = _jwks_cache.get("jwks")
    if cached is not None:
        return cached  # type: ignore[return-value]
    async with httpx.AsyncClient() as client:
        resp = await client.get(settings.CLERK_JWKS_URL, timeout=5.0)
        resp.raise_for_status()
        data = resp.json()
        _jwks_cache["jwks"] = data
        return data  # type: ignore[return-value]


async def _fetch_clerk_user(clerk_id: str) -> dict | None:
    """Fetch user identity from Clerk's REST API.

    Clerk's default session token doesn't include email/name for OAuth sign-ins,
    so we fall back to the REST API to populate the user record.
    """
    if not settings.CLERK_SECRET_KEY:
        return None
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/users/{clerk_id}",
                headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
                timeout=10.0,
            )
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None


def _extract_clerk_identity(user_data: dict) -> tuple[str, str]:
    """Extract (email, name) from a Clerk user payload."""
    emails = user_data.get("email_addresses") or []
    primary_id = user_data.get("primary_email_address_id")
    email = ""
    for e in emails:
        if e.get("id") == primary_id:
            email = e.get("email_address") or ""
            break
    if not email and emails:
        email = emails[0].get("email_address") or ""
    first = user_data.get("first_name") or ""
    last = user_data.get("last_name") or ""
    name = f"{first} {last}".strip() or email
    return email, name


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    # Import here to avoid circular imports at module load time
    from app.models.user import User

    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(token, jwks, algorithms=["RS256"])
        clerk_id: str | None = payload.get("sub")
        if not clerk_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()

    # Backfill empty email/name for users created before the Clerk-API fallback
    # existed (e.g., Google OAuth sign-ins where the JWT had no email claim).
    if user and not user.email:
        clerk_data = await _fetch_clerk_user(clerk_id)
        if clerk_data:
            api_email, api_name = _extract_clerk_identity(clerk_data)
            if api_email:
                user.email = api_email
            if api_name and (not user.name or user.name == user.email):
                user.name = api_name
            session.add(user)
            session.commit()
            session.refresh(user)

    if not user:
        email = payload.get("email") or ""
        first = payload.get("first_name") or ""
        last = payload.get("last_name") or ""
        name = f"{first} {last}".strip()

        # Fall back to Clerk's REST API if the JWT didn't carry these claims.
        # Clerk's default session token omits email/name for OAuth sign-ins.
        if not email or not name:
            clerk_data = await _fetch_clerk_user(clerk_id)
            if clerk_data:
                api_email, api_name = _extract_clerk_identity(clerk_data)
                if not email:
                    email = api_email
                if not name:
                    name = api_name
        if not name:
            name = email

        # Check for a pending user created during an unauthenticated booking.
        # Guard with `if email` so the match doesn't sweep up other empty-email
        # pending rows.
        pending = None
        if email:
            pending = session.exec(
                select(User).where(User.email == email, User.clerk_id.like("pending_%"))
            ).first()

        if pending:
            # Link the real Clerk ID to the existing record so bookings stay attached
            pending.clerk_id = clerk_id
            if not pending.name or pending.name == pending.email:
                pending.name = name
            session.add(pending)
            session.commit()
            session.refresh(pending)
            return pending

        user = User(clerk_id=clerk_id, email=email, name=name)
        session.add(user)
        session.commit()
        session.refresh(user)

    return user


async def get_admin_user(
    current_user=Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    session: Session = Depends(get_session),
):
    """Returns the current user or None for optional auth endpoints."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None
