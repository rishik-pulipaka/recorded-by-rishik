"""Integration tests for the public API surface."""

from sqlmodel import select

from app.models.booking import Booking, BookingEvent
from app.models.quote import Quote
from app.models.user import User

BOOKING_PAYLOAD = {
    "shoot_type": "headshots",
    "package_id": "headshot-basic",
    "addon_ids": ["rush"],
    "start_time": "2026-11-20T10:00:00",
    "end_time": "2026-11-20T10:30:00",
    "location": "Riverside",
    "name": "New Client",
    "email": "new@example.com",
    "phone": "555-0100",
}


def test_pricing_lists_active_rules_sorted(client, pricing):
    resp = client.get("/api/v1/pricing")
    assert resp.status_code == 200
    names = [r["name"] for r in resp.json()]
    assert "1 Hour" in names
    assert "Weekend Surcharge" in names


def test_pricing_is_cached_until_admin_edit(client, session, pricing, auth_state, users):
    first = client.get("/api/v1/pricing").json()
    # Change the price directly in the DB: the API still serves the cache.
    rule = pricing["1 Hour"]
    rule.base_price = rule.base_price + 50
    session.add(rule)
    session.commit()
    second = client.get("/api/v1/pricing").json()
    assert second == first
    # An admin edit invalidates the cache.
    auth_state["user"] = users["admin"]
    resp = client.patch(
        f"/api/v1/admin/pricing-rules/{rule.id}", json={"base_price": "200"}
    )
    assert resp.status_code == 200
    third = client.get("/api/v1/pricing").json()
    one_hour = [r for r in third if r["name"] == "1 Hour"][0]
    assert float(one_hour["base_price"]) == 200.0


def test_create_quote_persists_and_totals(client, session, pricing):
    resp = client.post(
        "/api/v1/quotes",
        json={
            "session_id": "sess-9",
            "shoot_type": "Headshots",
            "package_id": str(pricing["1 Hour"].id),
            "addon_ids": [],
            "date": "2026-11-09",
            "location": "Riverside",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert float(body["total"]) == 100.0
    stored = session.exec(select(Quote)).all()
    assert len(stored) == 1
    assert str(stored[0].id) == body["id"]


def test_create_booking_makes_pending_user_and_event(client, session):
    resp = client.post("/api/v1/bookings", json=BOOKING_PAYLOAD)
    assert resp.status_code == 201
    body = resp.json()
    # headshot-basic $65 + rush $50, from the pricing table
    assert float(body["quote_total"]) == 115.0
    assert body["status"] == "pending_confirmation"

    user = session.exec(select(User).where(User.email == "new@example.com")).one()
    assert user.clerk_id.startswith("pending_")
    events = session.exec(select(BookingEvent)).all()
    assert [e.event_type for e in events] == ["booking_created"]
    bookings = session.exec(select(Booking)).all()
    assert len(bookings) == 1


def test_availability_slots_are_business_hours_pacific(client):
    resp = client.get("/api/v1/availability?from=2026-11-09&to=2026-11-09")
    assert resp.status_code == 200
    slots = resp.json()
    assert len(slots) == 10
    # 9 AM Pacific (PST, UTC-8 in November), not 9 AM UTC
    assert slots[0]["start"].startswith("2026-11-09T09:00")
    assert slots[0]["start"].endswith("-08:00")
    assert all(s["available"] for s in slots)


def test_availability_closed_on_sunday(client):
    resp = client.get("/api/v1/availability?from=2026-11-08&to=2026-11-08")
    assert resp.status_code == 200
    assert resp.json() == []


def test_contact_form_accepted(client):
    resp = client.post(
        "/api/v1/contact",
        json={
            "name": "Sam",
            "email": "sam@example.com",
            "subject": "Question",
            "message": "Hello",
        },
    )
    assert resp.status_code == 204
