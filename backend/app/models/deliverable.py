import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Deliverable(SQLModel, table=True):
    __tablename__ = "deliverables"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    booking_id: uuid.UUID = Field(foreign_key="bookings.id", unique=True, index=True)
    gallery_url: str
    notes: Optional[str] = Field(default=None)
    delivered_at: datetime = Field(default_factory=_utcnow)
