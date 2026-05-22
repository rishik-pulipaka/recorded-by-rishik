import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr
from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    """Submitted by a client from the booking form."""
    quote_id: str | None = None
    shoot_type: str
    package_id: str
    addon_ids: list[str] = []
    start_time: datetime
    end_time: datetime
    location: str
    special_notes: str | None = None
    # Contact info (used to find/create the client user)
    name: str
    email: EmailStr
    phone: str


class BookingRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    shoot_type: str
    package_id: str
    start_time: datetime
    end_time: datetime
    location: str
    special_notes: str | None
    status: BookingStatus
    quote_total: Decimal
    deposit_amount: Decimal
    balance_paid: bool
    calendar_event_id: str | None
    internal_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BookingAdminUpdate(BaseModel):
    status: BookingStatus | None = None
    internal_notes: str | None = None
    deposit_amount: Decimal | None = None
    balance_paid: bool | None = None


class BookingEventRead(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    event_type: str
    payload: dict | None
    created_by: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    body: str


class MessageRead(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    sender_id: uuid.UUID
    body: str
    read_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DeliverableCreate(BaseModel):
    gallery_url: str
    notes: str | None = None


class DeliverableRead(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    gallery_url: str
    notes: str | None
    delivered_at: datetime

    model_config = {"from_attributes": True}


class ContactFormSubmission(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    subject: str
    message: str


class RescheduleRequest(BaseModel):
    proposed_start: datetime
    proposed_end: datetime
    reason: str | None = None
