"""Google Calendar integration.

Stores the OAuth refresh token in the settings table under key
"google_calendar_token" as JSON: {"refresh_token": "...", "token_uri": "..."}

Business hours are stored under key "business_hours" as:
{
  "timezone": "America/Los_Angeles",
  "days": [1,2,3,4,5,6],   # 1=Mon ... 6=Sat
  "start_hour": 9,
  "end_hour": 19
}
"""

from datetime import date, datetime, time, timedelta, timezone
from typing import Any
import json
from sqlmodel import Session, select

from app.config import settings
from app.models.settings import Setting
from app.schemas.quote import AvailabilitySlot

SCOPES = ["https://www.googleapis.com/auth/calendar"]
_REDIRECT_URI_PATH = "/api/v1/admin/settings/google-calendar/callback"

DEFAULT_BUSINESS_HOURS = {
    "timezone": "America/Los_Angeles",
    "days": [0, 1, 2, 3, 4, 5],  # Mon–Sat
    "start_hour": 9,
    "end_hour": 19,
}


class CalendarService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._creds = None

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _get_setting(self, key: str) -> Any:
        row = self._session.exec(select(Setting).where(Setting.key == key)).first()
        return row.value if row else None

    def _set_setting(self, key: str, value: Any) -> None:
        row = self._session.exec(select(Setting).where(Setting.key == key)).first()
        if row:
            row.value = value
            row.updated_at = datetime.now(timezone.utc)
        else:
            from app.models.settings import Setting as SettingModel
            row = SettingModel(key=key, value=value)
        self._session.add(row)
        self._session.commit()

    def _build_flow(self):
        from google_auth_oauthlib.flow import Flow
        return Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
            redirect_uri=f"{settings.API_BASE_URL}{_REDIRECT_URI_PATH}",
        )

    def _get_service(self):
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build

        token_data = self._get_setting("google_calendar_token")
        if not token_data:
            return None

        creds = Credentials(
            token=None,
            refresh_token=token_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        return build("calendar", "v3", credentials=creds)

    # ── Public API ────────────────────────────────────────────────────────────

    def is_connected(self) -> bool:
        token_data = self._get_setting("google_calendar_token")
        return bool(token_data and token_data.get("refresh_token"))

    def get_auth_url(self, login_hint: str | None = None) -> str:
        flow = self._build_flow()
        kwargs: dict = {
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "consent",
        }
        if login_hint:
            # Pre-selects this Google account on the consent screen, so the
            # admin's browser doesn't default to whatever account is signed in.
            kwargs["login_hint"] = login_hint
        auth_url, _ = flow.authorization_url(**kwargs)
        return auth_url

    def exchange_code(self, code: str) -> None:
        flow = self._build_flow()
        flow.fetch_token(code=code)
        creds = flow.credentials
        self._set_setting("google_calendar_token", {
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
        })

    def get_available_slots(
        self, from_date: date, to_date: date
    ) -> list[AvailabilitySlot]:
        bh = self._get_setting("business_hours") or DEFAULT_BUSINESS_HOURS
        slots: list[AvailabilitySlot] = []

        service = self._get_service()

        current = from_date
        while current <= to_date:
            # Skip days outside business hours
            if current.weekday() not in bh["days"]:
                current += timedelta(days=1)
                continue

            day_start = datetime.combine(current, time(bh["start_hour"], 0), tzinfo=timezone.utc)
            day_end = datetime.combine(current, time(bh["end_hour"], 0), tzinfo=timezone.utc)

            if service:
                try:
                    resp = service.freebusy().query(body={
                        "timeMin": day_start.isoformat(),
                        "timeMax": day_end.isoformat(),
                        "items": [{"id": "primary"}],
                    }).execute()
                    busy = resp.get("calendars", {}).get("primary", {}).get("busy", [])
                except Exception:
                    busy = []
            else:
                busy = []

            # Generate hourly slots and mark availability
            slot_time = day_start
            while slot_time < day_end:
                slot_end = slot_time + timedelta(hours=1)
                is_busy = any(
                    datetime.fromisoformat(b["start"]) < slot_end
                    and datetime.fromisoformat(b["end"]) > slot_time
                    for b in busy
                )
                slots.append(AvailabilitySlot(
                    start=slot_time,
                    end=slot_end,
                    available=not is_busy,
                ))
                slot_time = slot_end

            current += timedelta(days=1)

        return slots

    def create_booking_event(self, booking: Any, client: Any) -> str | None:
        service = self._get_service()
        if not service:
            return None

        event = {
            "summary": f"📸 {client.name} — {booking.shoot_type}",
            "description": (
                f"Client: {client.name}\n"
                f"Email: {client.email}\n"
                f"Phone: {client.phone or 'N/A'}\n"
                f"Package: {booking.shoot_type}\n"
                f"Location: {booking.location}\n"
                f"Notes: {booking.special_notes or 'None'}"
            ),
            "start": {"dateTime": booking.start_time.isoformat(), "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": booking.end_time.isoformat(), "timeZone": "America/Los_Angeles"},
        }
        created = service.events().insert(calendarId="primary", body=event).execute()
        event_id: str = created.get("id", "")

        # Persist event ID on booking
        from datetime import datetime, timezone
        booking.calendar_event_id = event_id
        booking.updated_at = datetime.now(timezone.utc)
        self._session.add(booking)
        self._session.commit()

        return event_id

    def delete_booking_event(self, event_id: str) -> None:
        service = self._get_service()
        if not service or not event_id:
            return
        try:
            service.events().delete(calendarId="primary", eventId=event_id).execute()
        except Exception:
            pass
