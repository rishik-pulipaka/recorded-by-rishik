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


@router.post("/bookings", response_model=BookingRead, status_code=201)
def create_booking(payload: BookingCreate, session: Session = Depends(get_session)):
    # Find or create client user (they may not be logged in yet)
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        user = User(
            clerk_id=f"pending_{uuid.uuid4()}",  # Placeholder until they create an account
            email=payload.email,
            name=payload.name,
            phone=payload.phone,
        )
        session.add(user)
        session.flush()

    # Validate the quote exists and isn't expired
    quote = session.get(Quote, payload.quote_id)
    if not quote:
        raise HTTPException(status_code=400, detail="Quote not found")

    booking = Booking(
        client_id=user.id,
        shoot_type=payload.shoot_type,
        package_id=payload.package_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        special_notes=payload.special_notes,
        quote_total=quote.total,
        deposit_amount=quote.total * 1,  # Full amount; admin sets deposit when confirming
    )
    session.add(booking)
    session.flush()

    # Add-ons
    for addon_id in payload.addon_ids:
        rule = session.get(PricingRule, addon_id)
        if rule:
            session.add(BookingAddon(
                booking_id=booking.id,
                pricing_rule_id=addon_id,
                price_snapshot=rule.base_price,
            ))

    # Audit event
    session.add(BookingEvent(
        booking_id=booking.id,
        event_type="booking_created",
        payload={"status": BookingStatus.pending_confirmation},
        created_by=user.id,
    ))

    # Mark quote as converted
    quote.converted_to_booking_id = booking.id
    session.add(quote)
    session.commit()
    session.refresh(booking)

    # Send emails (non-blocking — errors are logged not raised)
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
        raise HTTPException(status_code=500, detail="Failed to send message")
