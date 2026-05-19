# Import all models here so Alembic auto-discovers them
from app.models.user import User
from app.models.pricing import PricingRule, RuleType
from app.models.booking import Booking, BookingAddon, BookingEvent, BookingStatus
from app.models.quote import Quote
from app.models.message import Message
from app.models.deliverable import Deliverable
from app.models.settings import Setting

__all__ = [
    "User",
    "PricingRule",
    "RuleType",
    "Booking",
    "BookingAddon",
    "BookingEvent",
    "BookingStatus",
    "Quote",
    "Message",
    "Deliverable",
    "Setting",
]
