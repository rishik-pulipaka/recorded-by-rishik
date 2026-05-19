import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    booking_id: uuid.UUID = Field(foreign_key="bookings.id", index=True)
    sender_id: uuid.UUID = Field(foreign_key="users.id")
    body: str
    read_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=_utcnow)
