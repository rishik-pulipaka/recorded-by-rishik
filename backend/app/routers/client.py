import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.booking import Booking, BookingAddon, BookingEvent
from app.models.message import Message
from app.models.deliverable import Deliverable
from app.models.pricing import PricingRule
from app.schemas.user import UserRead, UserUpdate
from app.schemas.booking import (
    BookingRead,
    BookingDetailRead,
    BookingEventRead,
    MessageCreate,
    MessageRead,
    MessageDetailRead,
    ClientSummary,
    AddonSummary,
    DeliverableRead,
    RescheduleRequest,
)

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.phone is not None:
        current_user.phone = payload.phone
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.get("/me/bookings", response_model=list[BookingRead])
def my_bookings(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    bookings = session.exec(
        select(Booking)
        .where(Booking.client_id == current_user.id, Booking.deleted_at == None)  # noqa: E711
        .order_by(Booking.start_time.desc())
    ).all()
    return bookings


@router.get("/bookings/{booking_id}", response_model=BookingDetailRead)
def get_booking(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking or booking.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")

    addon_rows = session.exec(
        select(BookingAddon, PricingRule)
        .join(PricingRule, BookingAddon.pricing_rule_id == PricingRule.id)
        .where(BookingAddon.booking_id == booking_id)
    ).all()
    addons = [AddonSummary(name=rule.name, price=float(addon.price_snapshot)) for addon, rule in addon_rows]

    msg_rows = session.exec(
        select(Message, User)
        .join(User, Message.sender_id == User.id)
        .where(Message.booking_id == booking_id)
        .order_by(Message.created_at)
    ).all()
    messages = [
        MessageDetailRead(
            id=msg.id,
            sender_name=sender.name,
            body=msg.body,
            created_at=msg.created_at,
            is_admin=sender.role == "admin",
        )
        for msg, sender in msg_rows
    ]

    events = session.exec(
        select(BookingEvent)
        .where(BookingEvent.booking_id == booking_id)
        .order_by(BookingEvent.created_at)
    ).all()

    deliverable = session.exec(
        select(Deliverable).where(Deliverable.booking_id == booking_id)
    ).first()

    return BookingDetailRead(
        **booking.model_dump(),
        client=ClientSummary(id=current_user.id, name=current_user.name, email=current_user.email, phone=current_user.phone),
        addons=addons,
        messages=messages,
        events=events,
        deliverable=deliverable,
    )


@router.get("/bookings/{booking_id}/events", response_model=list[BookingEventRead])
def get_booking_events(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking or booking.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    events = session.exec(
        select(BookingEvent)
        .where(BookingEvent.booking_id == booking_id)
        .order_by(BookingEvent.created_at)
    ).all()
    return events


@router.get("/bookings/{booking_id}/messages", response_model=list[MessageRead])
def get_messages(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking or booking.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    messages = session.exec(
        select(Message)
        .where(Message.booking_id == booking_id)
        .order_by(Message.created_at)
    ).all()
    return messages


@router.post("/bookings/{booking_id}/messages", response_model=MessageDetailRead, status_code=201)
def send_message(
    booking_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking or booking.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    msg = Message(
        booking_id=booking_id,
        sender_id=current_user.id,
        body=payload.body,
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return MessageDetailRead(
        id=msg.id,
        sender_name=current_user.name,
        body=msg.body,
        created_at=msg.created_at,
        is_admin=False,
    )


@router.post("/bookings/{booking_id}/reschedule-request", status_code=204)
def reschedule_request(
    booking_id: uuid.UUID,
    payload: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking or booking.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    session.add(BookingEvent(
        booking_id=booking_id,
        event_type="reschedule_requested",
        payload={
            "proposed_start": payload.proposed_start.isoformat(),
            "proposed_end": payload.proposed_end.isoformat(),
            "reason": payload.reason,
        },
        created_by=current_user.id,
    ))
    session.commit()


@router.get("/bookings/{booking_id}/deliverables", response_model=DeliverableRead | None)
def get_deliverables(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    booking = session.get(Booking, booking_id)
    if not booking or booking.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    return session.exec(
        select(Deliverable).where(Deliverable.booking_id == booking_id)
    ).first()
