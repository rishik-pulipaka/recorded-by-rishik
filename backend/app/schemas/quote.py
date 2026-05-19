import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel


class QuoteLineItem(BaseModel):
    label: str
    amount: Decimal
    unit: str = "flat"


class QuoteRequest(BaseModel):
    session_id: str
    shoot_type: str
    package_id: uuid.UUID
    addon_ids: list[uuid.UUID] = []
    date: date
    location: str
    # Optional: used to associate quote with a logged-in user
    user_id: uuid.UUID | None = None


class QuoteResponse(BaseModel):
    id: uuid.UUID
    line_items: list[QuoteLineItem]
    modifiers: list[QuoteLineItem]
    subtotal: Decimal
    total: Decimal
    currency: str = "USD"
    valid_until: datetime


class AvailabilitySlot(BaseModel):
    start: datetime
    end: datetime
    available: bool
