import uuid
import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BookingStatus(str, enum.Enum):
    pending_confirmation = "pending_confirmation"
    confirmed = "confirmed"
    deposit_paid = "deposit_paid"
    completed = "completed"
    archived = "archived"
    cancelled = "cancelled"


class Booking(SQLModel, table=True):
    __tablename__ = "bookings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    client_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    shoot_type: str
    package_id: str = Field(index=True)
    start_time: datetime
    end_time: datetime
    location: str
    special_notes: Optional[str] = Field(default=None)
    status: BookingStatus = Field(default=BookingStatus.pending_confirmation)
    quote_total: Decimal = Field(default=Decimal("0.00"), decimal_places=2, max_digits=10)
    deposit_amount: Decimal = Field(default=Decimal("0.00"), decimal_places=2, max_digits=10)
    balance_paid: bool = Field(default=False)
    calendar_event_id: Optional[str] = Field(default=None)
    internal_notes: Optional[str] = Field(default=None)
    deleted_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class BookingAddon(SQLModel, table=True):
    __tablename__ = "booking_addons"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    booking_id: uuid.UUID = Field(foreign_key="bookings.id", index=True)
    pricing_rule_id: uuid.UUID = Field(foreign_key="pricing_rules.id")
    quantity: int = Field(default=1)
    # Snapshot price at time of booking (rules may change later)
    price_snapshot: Decimal = Field(default=Decimal("0.00"), decimal_places=2, max_digits=10)


class BookingEvent(SQLModel, table=True):
    """Immutable audit log of all state transitions and actions on a booking."""
    __tablename__ = "booking_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    booking_id: uuid.UUID = Field(foreign_key="bookings.id", index=True)
    # e.g. "status_changed", "note_added", "deposit_paid", "calendar_event_created"
    event_type: str
    payload: Optional[Any] = Field(default=None, sa_column=Column(JSONB, nullable=True))
    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_utcnow)
