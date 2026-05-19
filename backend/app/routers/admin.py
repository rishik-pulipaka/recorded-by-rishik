import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from app.db import get_session
from app.auth import get_admin_user
from app.models.user import User
from app.models.booking import Booking, BookingEvent, BookingStatus, Message
from app.models.deliverable import Deliverable
from app.models.pricing import PricingRule
from app.models.quote import Quote
from app.models.settings import Setting
from app.schemas.booking import (
    BookingRead,
    BookingAdminUpdate,
    BookingEventRead,
    MessageRead,
    DeliverableCreate,
    DeliverableRead,
)
from app.schemas.pricing import PricingRuleCreate, PricingRuleRead, PricingRuleUpdate
from app.schemas.user import UserRead
from app.services.calendar import CalendarService
from app.services.email import EmailService

router = APIRouter(dependencies=[Depends(get_admin_user)])


# ── Bookings ──────────────────────────────────────────────────────────────────

@router.get("/bookings", response_model=list[BookingRead])
def list_bookings(
    status: BookingStatus | None = None,
    from_date: datetime | None = Query(default=None, alias="from"),
    to_date: datetime | None = Query(default=None, alias="to"),
    session: Session = Depends(get_session),
):
    q = select(Booking).where(Booking.deleted_at == None)  # noqa: E711
    if status:
        q = q.where(Booking.status == status)
    if from_date:
        q = q.where(Booking.start_time >= from_date)
    if to_date:
        q = q.where(Booking.start_time <= to_date)
    return session.exec(q.order_by(Booking.start_time.desc())).all()


@router.get("/bookings/{booking_id}", response_model=BookingRead)
def get_booking(booking_id: uuid.UUID, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking or booking.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.patch("/bookings/{booking_id}", response_model=BookingRead)
def update_booking(
    booking_id: uuid.UUID,
    payload: BookingAdminUpdate,
    admin: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking or booking.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Booking not found")

    old_status = booking.status
    if payload.status is not None:
        booking.status = payload.status
    if payload.internal_notes is not None:
        booking.internal_notes = payload.internal_notes
    if payload.deposit_amount is not None:
        booking.deposit_amount = payload.deposit_amount
    if payload.balance_paid is not None:
        booking.balance_paid = payload.balance_paid

    booking.updated_at = datetime.now(timezone.utc)
    session.add(booking)

    # Audit event
    if payload.status and payload.status != old_status:
        session.add(BookingEvent(
            booking_id=booking_id,
            event_type="status_changed",
            payload={"from": old_status, "to": payload.status},
            created_by=admin.id,
        ))
        # Fire confirmation email when admin confirms booking
        if payload.status == BookingStatus.confirmed:
            client = session.get(User, booking.client_id)
            if client:
                try:
                    EmailService().send_booking_confirmed_client(booking, client)
                    # Create Google Calendar event
                    CalendarService(session).create_booking_event(booking, client)
                except Exception:
                    pass

    session.commit()
    session.refresh(booking)
    return booking


@router.delete("/bookings/{booking_id}", status_code=204)
def cancel_booking(
    booking_id: uuid.UUID,
    admin: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.cancelled
    booking.deleted_at = datetime.now(timezone.utc)
    booking.updated_at = datetime.now(timezone.utc)
    session.add(BookingEvent(
        booking_id=booking_id,
        event_type="booking_cancelled",
        payload={},
        created_by=admin.id,
    ))
    session.add(booking)
    session.commit()
    # Delete calendar event
    if booking.calendar_event_id:
        try:
            CalendarService(session).delete_booking_event(booking.calendar_event_id)
        except Exception:
            pass


@router.get("/bookings/{booking_id}/events", response_model=list[BookingEventRead])
def get_booking_events(booking_id: uuid.UUID, session: Session = Depends(get_session)):
    return session.exec(
        select(BookingEvent)
        .where(BookingEvent.booking_id == booking_id)
        .order_by(BookingEvent.created_at)
    ).all()


@router.get("/bookings/{booking_id}/messages", response_model=list[MessageRead])
def get_booking_messages(booking_id: uuid.UUID, session: Session = Depends(get_session)):
    return session.exec(
        select(Message)
        .where(Message.booking_id == booking_id)
        .order_by(Message.created_at)
    ).all()


@router.post("/bookings/{booking_id}/deliverables", response_model=DeliverableRead, status_code=201)
def attach_deliverables(
    booking_id: uuid.UUID,
    payload: DeliverableCreate,
    admin: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    deliverable = Deliverable(
        booking_id=booking_id,
        gallery_url=payload.gallery_url,
        notes=payload.notes,
    )
    session.add(deliverable)
    session.commit()
    session.refresh(deliverable)
    # Notify client
    client = session.get(User, booking.client_id)
    if client:
        try:
            EmailService().send_deliverables_ready(booking, client, deliverable)
        except Exception:
            pass
    return deliverable


# ── Clients ───────────────────────────────────────────────────────────────────

@router.get("/clients", response_model=list[UserRead])
def list_clients(session: Session = Depends(get_session)):
    return session.exec(
        select(User).where(User.role == "client", User.deleted_at == None)  # noqa: E711
    ).all()


@router.get("/clients/{client_id}", response_model=UserRead)
def get_client(client_id: uuid.UUID, session: Session = Depends(get_session)):
    user = session.get(User, client_id)
    if not user or user.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Client not found")
    return user


@router.get("/clients/{client_id}/bookings", response_model=list[BookingRead])
def client_bookings(client_id: uuid.UUID, session: Session = Depends(get_session)):
    return session.exec(
        select(Booking)
        .where(Booking.client_id == client_id, Booking.deleted_at == None)  # noqa: E711
        .order_by(Booking.start_time.desc())
    ).all()


# ── Quotes (unconverted leads) ────────────────────────────────────────────────

@router.get("/quotes")
def list_unconverted_quotes(session: Session = Depends(get_session)):
    return session.exec(
        select(Quote)
        .where(Quote.converted_to_booking_id == None)  # noqa: E711
        .order_by(Quote.created_at.desc())
        .limit(100)
    ).all()


# ── Pricing ───────────────────────────────────────────────────────────────────

@router.post("/pricing-rules", response_model=PricingRuleRead, status_code=201)
def create_pricing_rule(
    payload: PricingRuleCreate, session: Session = Depends(get_session)
):
    rule = PricingRule(**payload.model_dump())
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.patch("/pricing-rules/{rule_id}", response_model=PricingRuleRead)
def update_pricing_rule(
    rule_id: uuid.UUID,
    payload: PricingRuleUpdate,
    session: Session = Depends(get_session),
):
    rule = session.get(PricingRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    rule.updated_at = datetime.now(timezone.utc)
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.delete("/pricing-rules/{rule_id}", status_code=204)
def delete_pricing_rule(rule_id: uuid.UUID, session: Session = Depends(get_session)):
    rule = session.get(PricingRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found")
    rule.active = False
    rule.updated_at = datetime.now(timezone.utc)
    session.add(rule)
    session.commit()


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics/funnel")
def funnel_analytics(session: Session = Depends(get_session)):
    total_quotes = session.exec(select(func.count(Quote.id))).one()
    converted = session.exec(
        select(func.count(Quote.id)).where(Quote.converted_to_booking_id != None)  # noqa: E711
    ).one()
    confirmed = session.exec(
        select(func.count(Booking.id)).where(
            Booking.status.in_([BookingStatus.confirmed, BookingStatus.deposit_paid, BookingStatus.completed])
        )
    ).one()
    return {
        "quotes_started": total_quotes,
        "quotes_converted": converted,
        "bookings_confirmed": confirmed,
        "conversion_rate": round(converted / total_quotes * 100, 1) if total_quotes else 0,
    }


@router.get("/analytics/overview")
def overview_analytics(session: Session = Depends(get_session)):
    from datetime import date, timedelta
    today = date.today()
    seven_days = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
    month_start = today.replace(day=1)

    upcoming = session.exec(
        select(func.count(Booking.id)).where(
            Booking.start_time >= seven_days,
            Booking.deleted_at == None,  # noqa: E711
        )
    ).one()
    pending = session.exec(
        select(func.count(Booking.id)).where(
            Booking.status == BookingStatus.pending_confirmation
        )
    ).one()
    revenue = session.exec(
        select(func.sum(Booking.quote_total)).where(
            Booking.start_time >= datetime.combine(month_start, datetime.min.time()),
            Booking.status.in_([BookingStatus.confirmed, BookingStatus.deposit_paid, BookingStatus.completed]),
        )
    ).one()
    total_clients = session.exec(
        select(func.count(User.id)).where(User.role == "client", User.deleted_at == None)  # noqa: E711
    ).one()

    return {
        "upcoming_shoots_7d": upcoming,
        "pending_confirmations": pending,
        "revenue_this_month": float(revenue or 0),
        "total_clients": total_clients,
    }


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings/{key}")
def get_setting(key: str, session: Session = Depends(get_session)):
    setting = session.exec(select(Setting).where(Setting.key == key)).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": setting.key, "value": setting.value}


@router.put("/settings/{key}")
def upsert_setting(key: str, payload: dict, session: Session = Depends(get_session)):
    setting = session.exec(select(Setting).where(Setting.key == key)).first()
    if setting:
        setting.value = payload.get("value")
        setting.updated_at = datetime.now(timezone.utc)
    else:
        setting = Setting(key=key, value=payload.get("value"))
    session.add(setting)
    session.commit()
    return {"key": setting.key, "value": setting.value}


@router.get("/settings/google-calendar/status")
def calendar_status(session: Session = Depends(get_session)):
    cal = CalendarService(session)
    return {"connected": cal.is_connected()}


@router.get("/settings/google-calendar/connect")
def calendar_connect(session: Session = Depends(get_session)):
    cal = CalendarService(session)
    url = cal.get_auth_url()
    return {"auth_url": url}


@router.get("/settings/google-calendar/callback")
def calendar_callback(code: str, session: Session = Depends(get_session)):
    cal = CalendarService(session)
    cal.exchange_code(code)
    return {"status": "connected"}
