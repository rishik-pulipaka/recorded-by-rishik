"""Integration tests for the authenticated client surface, incl. ownership."""

import uuid
from datetime import datetime, timezone

import pytest
from sqlmodel import select

from app.models.booking import Booking, BookingEvent


@pytest.fixture()
def booking(session, users):
    b = Booking(
        client_id=users["client"].id,
        shoot_type="headshots",
        package_id="headshot-basic",
        start_time=datetime(2026, 11, 20, 10, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 11, 20, 10, 30, tzinfo=timezone.utc),
        location="Riverside",
    )
    session.add(b)
    session.commit()
    session.refresh(b)
    return b


def test_me_returns_current_user(client, users):
    resp = client.get("/api/v1/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == users["client"].email


def test_my_bookings_only_shows_own(client, session, users, booking):
    other_booking = Booking(
        client_id=users["other"].id,
        shoot_type="modeling",
        package_id="modeling-basic",
        start_time=datetime(2026, 11, 21, 10, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 11, 21, 11, 0, tzinfo=timezone.utc),
        location="Riverside",
    )
    session.add(other_booking)
    session.commit()
    resp = client.get("/api/v1/me/bookings")
    assert resp.status_code == 200
    ids = [b["id"] for b in resp.json()]
    assert ids == [str(booking.id)]


def test_booking_detail_ok_for_owner(client, booking):
    resp = client.get(f"/api/v1/bookings/{booking.id}")
    assert resp.status_code == 200
    assert resp.json()["client"]["email"] == "client@example.com"


def test_booking_detail_forbidden_for_non_owner(client, session, users, auth_state, booking):
    auth_state["user"] = users["other"]
    resp = client.get(f"/api/v1/bookings/{booking.id}")
    assert resp.status_code == 403


def test_booking_detail_404_for_missing(client):
    resp = client.get(f"/api/v1/bookings/{uuid.uuid4()}")
    assert resp.status_code == 404


def test_message_roundtrip_and_ownership(client, session, users, auth_state, booking):
    resp = client.post(
        f"/api/v1/bookings/{booking.id}/messages", json={"body": "Running late?"}
    )
    assert resp.status_code == 201
    resp = client.get(f"/api/v1/bookings/{booking.id}/messages")
    assert [m["body"] for m in resp.json()] == ["Running late?"]
    # Another client cannot post to this booking
    auth_state["user"] = users["other"]
    resp = client.post(
        f"/api/v1/bookings/{booking.id}/messages", json={"body": "intruder"}
    )
    assert resp.status_code == 403


def test_reschedule_request_writes_event(client, session, booking):
    resp = client.post(
        f"/api/v1/bookings/{booking.id}/reschedule-request",
        json={
            "proposed_start": "2026-11-22T10:00:00",
            "proposed_end": "2026-11-22T10:30:00",
            "reason": "Work conflict",
        },
    )
    assert resp.status_code == 204
    events = session.exec(
        select(BookingEvent).where(BookingEvent.booking_id == booking.id)
    ).all()
    assert [e.event_type for e in events] == ["reschedule_requested"]
