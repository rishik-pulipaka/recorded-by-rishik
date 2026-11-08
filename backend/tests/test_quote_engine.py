"""Unit tests for the quote engine: the money math clients are charged by."""

from datetime import date
from decimal import Decimal

import pytest

from app.schemas.quote import QuoteRequest
from app.services.quote_engine import QuoteEngine

MONDAY = date(2026, 11, 9)
SATURDAY = date(2026, 11, 14)


def _req(package_id, addon_ids=(), on=MONDAY):
    return QuoteRequest(
        session_id="sess-1",
        shoot_type="Headshots",
        package_id=package_id,
        addon_ids=list(addon_ids),
        date=on,
        location="Riverside",
    )


def test_package_only_weekday_total(session, pricing):
    engine = QuoteEngine(session)
    result = engine.calculate(_req(pricing["1 Hour"].id))
    assert result.subtotal == Decimal("100")
    assert result.modifiers == []
    assert result.total == Decimal("100")


def test_addons_are_added(session, pricing):
    engine = QuoteEngine(session)
    result = engine.calculate(
        _req(pricing["1 Hour"].id, [pricing["Rush Delivery (48h)"].id])
    )
    assert result.subtotal == Decimal("150")
    assert result.total == Decimal("150")


def test_inactive_addon_is_skipped(session, pricing):
    pricing["Rush Delivery (48h)"].active = False
    session.add(pricing["Rush Delivery (48h)"])
    session.commit()
    engine = QuoteEngine(session)
    result = engine.calculate(
        _req(pricing["1 Hour"].id, [pricing["Rush Delivery (48h)"].id])
    )
    assert result.total == Decimal("100")


def test_weekend_modifier_applies_on_saturday(session, pricing):
    engine = QuoteEngine(session)
    result = engine.calculate(_req(pricing["1 Hour"].id, on=SATURDAY))
    # 15% weekend surcharge on the $100 package
    assert len(result.modifiers) == 1
    assert result.modifiers[0].amount == Decimal("15.00")
    assert result.total == Decimal("115.00")


def test_weekend_modifier_not_applied_on_weekday(session, pricing):
    engine = QuoteEngine(session)
    result = engine.calculate(_req(pricing["1 Hour"].id, on=MONDAY))
    assert result.modifiers == []


def test_unknown_package_raises(session, pricing):
    import uuid

    engine = QuoteEngine(session)
    with pytest.raises(ValueError):
        engine.calculate(_req(uuid.uuid4()))
