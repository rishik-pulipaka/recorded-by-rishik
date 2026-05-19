import uuid
import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RuleType(str, enum.Enum):
    shoot_type = "shoot_type"
    package = "package"
    addon = "addon"
    modifier = "modifier"


class PricingRule(SQLModel, table=True):
    __tablename__ = "pricing_rules"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    rule_type: RuleType
    name: str = Field(index=True)
    description: Optional[str] = Field(default=None)
    base_price: Decimal = Field(default=Decimal("0.00"), decimal_places=2, max_digits=10)
    # "flat" | "per_person" | "per_hour" | "percentage"
    unit: str = Field(default="flat")
    active: bool = Field(default=True)
    sort_order: int = Field(default=0)
    # Arbitrary JSON for modifier rules (e.g. {"type": "percentage", "value": 15})
    meta: Optional[Any] = Field(default=None, sa_column=Column(JSONB, nullable=True))
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
