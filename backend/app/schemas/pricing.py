import uuid
from decimal import Decimal
from typing import Any
from pydantic import BaseModel
from app.models.pricing import RuleType


class PricingRuleRead(BaseModel):
    id: uuid.UUID
    rule_type: RuleType
    name: str
    description: str | None
    base_price: Decimal
    unit: str
    active: bool
    sort_order: int
    meta: Any | None

    model_config = {"from_attributes": True}


class PricingRuleCreate(BaseModel):
    rule_type: RuleType
    name: str
    description: str | None = None
    base_price: Decimal
    unit: str = "flat"
    sort_order: int = 0
    meta: Any | None = None


class PricingRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    base_price: Decimal | None = None
    unit: str | None = None
    active: bool | None = None
    sort_order: int | None = None
    meta: Any | None = None
