"""Seed initial pricing rules into the database.

Run once after the first migration:
  cd backend && python -m app.seed
"""

from decimal import Decimal
from sqlmodel import Session, select
from app.db import engine, create_db_and_tables
from app.models.pricing import PricingRule, RuleType


SEED_RULES: list[dict] = [
    # ── Shoot types ───────────────────────────────────────────────────────────
    {"rule_type": RuleType.shoot_type, "name": "Portraits", "description": "Individual & group portrait sessions", "base_price": Decimal("0"), "unit": "flat", "sort_order": 1},
    {"rule_type": RuleType.shoot_type, "name": "Events", "description": "Birthdays, corporate, social events", "base_price": Decimal("0"), "unit": "flat", "sort_order": 2},
    {"rule_type": RuleType.shoot_type, "name": "Headshots", "description": "Professional headshots for LinkedIn, resumes", "base_price": Decimal("0"), "unit": "flat", "sort_order": 3},
    {"rule_type": RuleType.shoot_type, "name": "Products", "description": "Product & commercial photography", "base_price": Decimal("0"), "unit": "flat", "sort_order": 4},
    {"rule_type": RuleType.shoot_type, "name": "Real Estate", "description": "Interior & exterior property photography", "base_price": Decimal("0"), "unit": "flat", "sort_order": 5},

    # ── Packages ──────────────────────────────────────────────────────────────
    {"rule_type": RuleType.package, "name": "30 Minutes", "description": "Quick session — 3–5 edited photos", "base_price": Decimal("65"), "unit": "flat", "sort_order": 1, "meta": {"duration_hours": 0.5}},
    {"rule_type": RuleType.package, "name": "1 Hour", "description": "Standard session — 8–12 edited photos", "base_price": Decimal("100"), "unit": "flat", "sort_order": 2, "meta": {"duration_hours": 1}},
    {"rule_type": RuleType.package, "name": "2 Hours", "description": "Extended session — 15–20 edited photos", "base_price": Decimal("175"), "unit": "flat", "sort_order": 3, "meta": {"duration_hours": 2}},
    {"rule_type": RuleType.package, "name": "Half Day (4 hrs)", "description": "Deep coverage — 30–40 edited photos", "base_price": Decimal("300"), "unit": "flat", "sort_order": 4, "meta": {"duration_hours": 4}},
    {"rule_type": RuleType.package, "name": "Full Day (8 hrs)", "description": "Complete day coverage — 60+ edited photos", "base_price": Decimal("500"), "unit": "flat", "sort_order": 5, "meta": {"duration_hours": 8}},

    # ── Add-ons ───────────────────────────────────────────────────────────────
    {"rule_type": RuleType.addon, "name": "Extra Edits (+5 photos)", "description": "5 additional fully edited photos", "base_price": Decimal("25"), "unit": "flat", "sort_order": 1},
    {"rule_type": RuleType.addon, "name": "Rush Delivery (48h)", "description": "Receive your photos in 48 hours", "base_price": Decimal("50"), "unit": "flat", "sort_order": 2},
    {"rule_type": RuleType.addon, "name": "Second Location", "description": "Add a second shooting location", "base_price": Decimal("40"), "unit": "flat", "sort_order": 3},
    {"rule_type": RuleType.addon, "name": "Print Package", "description": "Set of 4×6 prints (20 photos)", "base_price": Decimal("75"), "unit": "flat", "sort_order": 4},

    # ── Modifiers ─────────────────────────────────────────────────────────────
    {"rule_type": RuleType.modifier, "name": "Weekend Surcharge", "description": "Applied to Saturday and Sunday bookings", "base_price": Decimal("0"), "unit": "percentage", "sort_order": 1, "meta": {"type": "percentage", "value": 15}},
    {"rule_type": RuleType.modifier, "name": "Holiday Surcharge", "description": "Applied on public holidays", "base_price": Decimal("0"), "unit": "percentage", "sort_order": 2, "meta": {"type": "percentage", "value": 25}},
]


def seed() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        existing_names = {r.name for r in session.exec(select(PricingRule)).all()}
        added = 0
        for rule_data in SEED_RULES:
            if rule_data["name"] not in existing_names:
                rule = PricingRule(**rule_data)
                session.add(rule)
                added += 1
        session.commit()
        print(f"Seeded {added} pricing rules.")


if __name__ == "__main__":
    seed()
