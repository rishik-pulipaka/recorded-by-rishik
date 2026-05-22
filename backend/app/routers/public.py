from datetime import date
from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.db import get_session
from app.models.pricing import PricingRule
from app.models.quote import Quote
from app.models.booking import Booking, BookingAddon, BookingEvent, BookingStatus
from app.models.user import User
from app.schemas.pricing import PricingRuleRead
from app.schemas.quote import QuoteRequest, QuoteResponse, AvailabilitySlot
from app.schemas.booking import BookingCreate, BookingRead, ContactFormSubmission
from app.services.quote_engine import QuoteEngine
from app.services.calendar import CalendarService
from app.services.email import EmailService

router = APIRouter()


@router.get("/pricing", response_model=list[PricingRuleRead])
def get_pricing(session: Session = Depends(get_session)):
    rules = session.exec(
        select(PricingRule).where(PricingRule.active == True).order_by(PricingRule.sort_order)  # noqa: E712
    ).all()
    return rules


@router.post("/quotes", response_model=QuoteResponse)
def create_quote(req: QuoteRequest, session: Session = Depends(get_session)):
    engine = QuoteEngine(session)
    quote_response = engine.calculate(req)

    # Persist for lead tracking
    quote = Quote(
        session_id=req.session_id,
        user_id=req.user_id,
        shoot_type=req.shoot_type,
        package_id=req.package_id,
        addons=[str(aid) for aid in req.addon_ids],
        total=quote_response.total,
        valid_until=quote_response.valid_until,
    )
    session.add(quote)
    session.commit()
    session.refresh(quote)

    return QuoteResponse(
        id=quote.id,
        **quote_response.model_dump(exclude={"id"}),
    )


@router.get("/availability", response_model=list[AvailabilitySlot])
def get_availability(
    from_date: Annotated[date, Query(alias="from")],
    to_date: Annotated[date, Query(alias="to")],
    session: Session = Depends(get_session),
):
    cal = CalendarService(session)
    return cal.get_available_slots(from_date, to_date)


# Local pricing lookup — mirrors lib/pricing.ts on the frontend
_PACKAGE_PRICES = {
    "headshot-basic": 65, "headshot-standard": 100, "headshot-pro": 175,
    "group-headshot-sm": 55, "group-headshot-md": 45, "group-headshot-lg": 40,
    "modeling-basic": 85, "modeling-standard": 130, "modeling-pro": 200,
    "group-modeling-sm": 70, "group-modeling-md": 60, "group-modeling-lg": 55,
}
_ADDON_PRICES = {
    "extra-edits": 25, "rush": 50, "second-location": 40,
}


@router.post("/bookings", response_model=BookingRead, status_code=201)
def create_booking(payload: BookingCreate, session: Session = Depends(get_session)):
    # Find or create client user
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        user = User(
            clerk_id=f"pending_{uuid.uuid4()}",
            email=payload.email,
            name=payload.name,
            phone=payload.phone,
        )
        session.add(user)
        session.flush()

    # Compute total from local pricing constants
    total = _PACKAGE_PRICES.get(payload.package_id, 0)
    total += sum(_ADDON_PRICES.get(aid, 0) for aid in payload.addon_ids)

    booking = Booking(
        client_id=user.id,
        shoot_type=payload.shoot_type,
        package_id=payload.package_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        special_notes=payload.special_notes,
        quote_total=total,
        deposit_amount=0,
    )
    session.add(booking)
    session.flush()

    session.add(BookingEvent(
        booking_id=booking.id,
        event_type="booking_created",
        payload={"status": BookingStatus.pending_confirmation, "addons": payload.addon_ids},
        created_by=user.id,
    ))

    session.commit()
    session.refresh(booking)

    email_svc = EmailService()
    try:
        email_svc.send_booking_received_admin(booking, user)
        email_svc.send_booking_confirmation_client(booking, user)
    except Exception:
        pass

    return booking


@router.post("/contact", status_code=204)
def contact_form(payload: ContactFormSubmission):
    email_svc = EmailService()
    try:
        email_svc.send_contact_form(payload)
    except Exception:
        pass  # Email errors logged by Sentry; don't surface to client
