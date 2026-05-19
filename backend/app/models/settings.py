import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Setting(SQLModel, table=True):
    """Key-value store for admin-configurable settings (business hours, tokens, etc.)."""
    __tablename__ = "settings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    key: str = Field(unique=True, index=True)
    value: Optional[Any] = Field(default=None, sa_column=Column(JSONB, nullable=True))
    updated_at: datetime = Field(default_factory=_utcnow)
