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

    if not user:
        email = payload.get("email") or ""
        first = payload.get("first_name") or ""
        last = payload.get("last_name") or ""
        name = f"{first} {last}".strip() or email

        # Check for a pending user created during an unauthenticated booking
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
