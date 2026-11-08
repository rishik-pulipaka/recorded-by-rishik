"""Integration tests for the admin surface: role gating and core flows."""

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


@pytest.fixture()
def as_admin(auth_state, users):
    auth_state["user"] = users["admin"]
    return users["admin"]


def test_admin_routes_reject_clients(client, booking):
    assert client.get("/api/v1/admin/bookings").status_code == 403
    assert (
        client.patch(f"/api/v1/admin/bookings/{booking.id}", json={}).status_code
        == 403
    )


def test_admin_lists_bookings(client, as_admin, booking):
    resp = client.get("/api/v1/admin/bookings")
    assert resp.status_code == 200
    assert [b["id"] for b in resp.json()] == [str(booking.id)]


def test_admin_confirm_writes_audit_event(client, session, as_admin, booking):
    resp = client.patch(
        f"/api/v1/admin/bookings/{booking.id}", json={"status": "confirmed"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "confirmed"
    events = session.exec(
        select(BookingEvent).where(BookingEvent.booking_id == booking.id)
    ).all()
    assert [e.event_type for e in events] == ["status_changed"]


def test_admin_cancel_soft_deletes(client, session, as_admin, booking):
    resp = client.request("DELETE", f"/api/v1/admin/bookings/{booking.id}")
    assert resp.status_code == 204
    session.refresh(booking)
    assert booking.status == "cancelled"
    assert booking.deleted_at is not None


def test_admin_pricing_rule_crud(client, session, as_admin):
    resp = client.post(
        "/api/v1/admin/pricing-rules",
        json={
            "rule_type": "addon",
            "name": "Drone Coverage",
            "base_price": "80",
            "unit": "flat",
        },
    )
    assert resp.status_code == 201
    rule_id = resp.json()["id"]
    resp = client.request("DELETE", f"/api/v1/admin/pricing-rules/{rule_id}")
    assert resp.status_code == 204
    # Deactivation, not hard delete: the row remains but is inactive.
    import uuid

    from app.models.pricing import PricingRule

    rule = session.get(PricingRule, uuid.UUID(rule_id))
    assert rule is not None and rule.active is False
