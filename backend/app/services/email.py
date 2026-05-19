"""Transactional email via Resend.

All templates are plain-text + simple HTML for reliability.
Swap for React Email templates in Phase 6 polish pass.
"""

from typing import Any
import resend
from app.config import settings


def _client() -> None:
    resend.api_key = settings.RESEND_API_KEY


ADMIN_EMAIL = "r.pulipaka18@gmail.com"
FROM_EMAIL = "Recorded by Rishik <no-reply@recordedbyrishik.com>"


class EmailService:
    def __init__(self) -> None:
        _client()

    def _send(self, *, to: str | list[str], subject: str, html: str) -> None:
        if not settings.RESEND_API_KEY:
            return
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to if isinstance(to, list) else [to],
            "subject": subject,
            "html": html,
        })

    def send_booking_received_admin(self, booking: Any, client: Any) -> None:
        self._send(
            to=ADMIN_EMAIL,
            subject=f"📸 New Booking Request — {client.name}",
            html=f"""
            <h2>New Booking Request</h2>
            <p><strong>Client:</strong> {client.name} ({client.email})</p>
            <p><strong>Shoot type:</strong> {booking.shoot_type}</p>
            <p><strong>Date/Time:</strong> {booking.start_time.strftime('%B %d, %Y at %I:%M %p')}</p>
            <p><strong>Location:</strong> {booking.location}</p>
            <p><strong>Estimated Total:</strong> ${booking.quote_total}</p>
            <p><strong>Notes:</strong> {booking.special_notes or 'None'}</p>
            <hr>
            <p>Log in to your dashboard to confirm or contact the client.</p>
            """,
        )

    def send_booking_confirmation_client(self, booking: Any, client: Any) -> None:
        self._send(
            to=client.email,
            subject="Your booking request was received — Recorded by Rishik",
            html=f"""
            <h2>Hi {client.name},</h2>
            <p>Thank you for your booking request! Here's a summary:</p>
            <ul>
                <li><strong>Session type:</strong> {booking.shoot_type}</li>
                <li><strong>Date/Time:</strong> {booking.start_time.strftime('%B %d, %Y at %I:%M %p')}</li>
                <li><strong>Location:</strong> {booking.location}</li>
                <li><strong>Estimated Total:</strong> ${booking.quote_total}</li>
            </ul>
            <p>I'll confirm your booking within 24 hours. If you have any questions, reply to this email.</p>
            <p>— Rishik</p>
            """,
        )

    def send_booking_confirmed_client(self, booking: Any, client: Any) -> None:
        self._send(
            to=client.email,
            subject="Your shoot is confirmed! — Recorded by Rishik",
            html=f"""
            <h2>You're all set, {client.name}!</h2>
            <p>Your photography session has been confirmed:</p>
            <ul>
                <li><strong>Date/Time:</strong> {booking.start_time.strftime('%B %d, %Y at %I:%M %p')}</li>
                <li><strong>Location:</strong> {booking.location}</li>
            </ul>
            <p>I'll send a reminder 48 hours before your session. Looking forward to working with you!</p>
            <p>— Rishik</p>
            """,
        )

    def send_reminder(self, booking: Any, client: Any) -> None:
        self._send(
            to=[client.email, ADMIN_EMAIL],
            subject=f"📅 Reminder: Shoot tomorrow — {client.name}",
            html=f"""
            <h2>Your shoot is tomorrow!</h2>
            <p>Hi {client.name}, just a reminder that your session is coming up:</p>
            <ul>
                <li><strong>Date/Time:</strong> {booking.start_time.strftime('%B %d, %Y at %I:%M %p')}</li>
                <li><strong>Location:</strong> {booking.location}</li>
            </ul>
            <p>See you then!</p>
            <p>— Rishik</p>
            """,
        )

    def send_deliverables_ready(self, booking: Any, client: Any, deliverable: Any) -> None:
        self._send(
            to=client.email,
            subject="Your photos are ready! — Recorded by Rishik",
            html=f"""
            <h2>Your photos are ready, {client.name}!</h2>
            <p>Your edited photos from your {booking.shoot_type} session are now available:</p>
            <p><a href="{deliverable.gallery_url}" style="
                background:#3D3D3D;color:white;padding:12px 24px;
                text-decoration:none;border-radius:6px;display:inline-block;
            ">View Your Gallery</a></p>
            {f'<p><em>{deliverable.notes}</em></p>' if deliverable.notes else ''}
            <p>It was a pleasure working with you!</p>
            <p>— Rishik</p>
            """,
        )

    def send_booking_cancelled(self, booking: Any, client: Any) -> None:
        self._send(
            to=[client.email, ADMIN_EMAIL],
            subject="Booking cancelled — Recorded by Rishik",
            html=f"""
            <h2>Booking Cancelled</h2>
            <p>Hi {client.name}, your booking for {booking.start_time.strftime('%B %d, %Y')} has been cancelled.</p>
            <p>If this was a mistake, please contact us to reschedule.</p>
            <p>— Rishik</p>
            """,
        )

    def send_contact_form(self, payload: Any) -> None:
        self._send(
            to=ADMIN_EMAIL,
            subject=f"New inquiry: {payload.subject} — {payload.name}",
            html=f"""
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {payload.name}</p>
            <p><strong>Email:</strong> {payload.email}</p>
            <p><strong>Phone:</strong> {payload.phone or 'N/A'}</p>
            <p><strong>Subject:</strong> {payload.subject}</p>
            <hr>
            <p>{payload.message}</p>
            """,
        )
