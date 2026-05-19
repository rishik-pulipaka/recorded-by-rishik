from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
from sqlmodel import Session, select
from app.models.pricing import PricingRule, RuleType
from app.schemas.quote import QuoteLineItem, QuoteRequest, QuoteResponse


class QuoteEngine:
    def __init__(self, session: Session) -> None:
        self._session = session

    def calculate(self, req: QuoteRequest) -> QuoteResponse:
        line_items: list[QuoteLineItem] = []
        modifiers: list[QuoteLineItem] = []

        # Base package price
        package = self._session.get(PricingRule, req.package_id)
        if not package:
            raise ValueError(f"Package {req.package_id} not found")
        line_items.append(QuoteLineItem(label=package.name, amount=package.base_price))

        # Add-ons
        for addon_id in req.addon_ids:
            addon = self._session.get(PricingRule, addon_id)
            if addon and addon.active:
                line_items.append(QuoteLineItem(label=addon.name, amount=addon.base_price))

        subtotal = sum(item.amount for item in line_items)

        # Modifiers (weekend, holiday, etc.)
        active_modifiers = self._session.exec(
            select(PricingRule).where(
                PricingRule.rule_type == RuleType.modifier,
                PricingRule.active == True,  # noqa: E712
            )
        ).all()

        is_weekend = req.date.weekday() >= 5  # Saturday=5, Sunday=6

        for mod in active_modifiers:
            meta = mod.meta or {}
            applies = False

            if mod.name.lower().startswith("weekend") and is_weekend:
                applies = True

            if applies and meta.get("type") == "percentage":
                pct = Decimal(str(meta.get("value", 0))) / Decimal("100")
                mod_amount = (subtotal * pct).quantize(Decimal("0.01"))
                modifiers.append(QuoteLineItem(
                    label=mod.name,
                    amount=mod_amount,
                    unit="percentage",
                ))

        total = subtotal + sum(m.amount for m in modifiers)

        return QuoteResponse(
            id=uuid.uuid4(),  # Will be replaced by the persisted Quote id in the router
            line_items=line_items,
            modifiers=modifiers,
            subtotal=subtotal,
            total=total,
            valid_until=datetime.now(timezone.utc) + timedelta(hours=24),
        )
