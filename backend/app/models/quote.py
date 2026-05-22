import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Quote(SQLModel, table=True):
    __tablename__ = "quotes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    # Identifies an anonymous browser session for lead recovery
    session_id: str = Field(index=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id", index=True)
    shoot_type: str
    package_id: Optional[str] = Field(default=None)
    # Full add-on selection stored as JSON snapshot
    addons: Optional[Any] = Field(default=None, sa_column=Column(JSONB, nullable=True))
    total: Decimal = Field(default=Decimal("0.00"), decimal_places=2, max_digits=10)
    valid_until: datetime
    # Set when client converts the quote to a booking
    converted_to_booking_id: Optional[uuid.UUID] = Field(default=None, foreign_key="bookings.id")
    created_at: datetime = Field(default_factory=_utcnow)
