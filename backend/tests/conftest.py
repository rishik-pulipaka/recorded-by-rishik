"""Test fixtures: the whole API runs against a throwaway SQLite database.

Env must be set before any app module is imported (settings are read at
import time). Auth is overridden at the dependency level: tests act as a
chosen user without minting Clerk JWTs, which keeps the suite hermetic
while still exercising every router, service, and the real DB layer.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("CLERK_JWKS_URL", "https://example.com/jwks")
os.environ.setdefault("CLERK_SECRET_KEY", "test-secret")
os.environ.setdefault("ENVIRONMENT", "test")

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.main import app
from app.db import get_session
from app.auth import get_current_user, get_admin_user
from app.models.user import User
from app.seed import SEED_RULES
from app.models.pricing import PricingRule
from app.services import cache


@pytest.fixture()
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(eng)
    yield eng
    SQLModel.metadata.drop_all(eng)


@pytest.fixture()
def session(engine):
    with Session(engine) as s:
        yield s


@pytest.fixture()
def users(session):
    client = User(clerk_id="clerk_client", email="client@example.com", name="Casey Client")
    other = User(clerk_id="clerk_other", email="other@example.com", name="Ollie Other")
    admin = User(
        clerk_id="clerk_admin", email="admin@example.com", name="Rishik Admin", role="admin"
    )
    session.add_all([client, other, admin])
    session.commit()
    for u in (client, other, admin):
        session.refresh(u)
    return {"client": client, "other": other, "admin": admin}


@pytest.fixture()
def auth_state(users):
    """Which user the overridden auth dependencies 'see'."""
    return {"user": users["client"]}


@pytest.fixture()
def client(session, auth_state):
    def override_session():
        yield session

    def override_current_user():
        return auth_state["user"]

    def override_admin_user():
        user = auth_state["user"]
        if user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
            )
        return user

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_admin_user] = override_admin_user
    cache.reset_for_tests()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    cache.reset_for_tests()


@pytest.fixture()
def pricing(session):
    """Seed the production pricing rules; returns them keyed by name."""
    rules = {}
    for data in SEED_RULES:
        rule = PricingRule(**data)
        session.add(rule)
        rules[data["name"]] = rule
    session.commit()
    for rule in rules.values():
        session.refresh(rule)
    return rules
