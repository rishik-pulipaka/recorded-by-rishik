"""Transactional email via Resend.

All templates are plain-text + simple HTML for reliability.
Swap for React Email templates in Phase 6 polish pass.
"""

from typing import Any
import resend
from app.config import settings


def _client() -> None:
    resend.api_key = settings.RESEND_API_KEY


ADMIN_EMAIL = "recordedbyrishik@gmail.com"
# Use onboarding@resend.dev until recordedbyrishik.com is verified in Resend
FROM_EMAIL = "Recorded by Rishik <onboarding@resend.dev>"


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
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #2a2a2a;">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:5px;color:#666;text-transform:uppercase;">Recorded by Rishik</p>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">New Inquiry</h1>
          </td>
        </tr>
        <!-- Sender info -->
        <tr>
          <td style="padding:28px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:16px;border-bottom:1px solid #222;">
                  <p style="margin:0 0 2px;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;">From</p>
                  <p style="margin:0;font-size:16px;color:#fff;font-weight:600;">{payload.name}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#888;">{payload.email}{f" &nbsp;·&nbsp; {payload.phone}" if payload.phone else ""}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid #222;">
                  <p style="margin:0 0 2px;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;">Subject</p>
                  <p style="margin:0;font-size:15px;color:#fff;">{payload.subject}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 0 28px;">
                  <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;">Message</p>
                  <p style="margin:0;font-size:14px;color:#ccc;line-height:1.7;white-space:pre-wrap;">{payload.message}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Reply CTA -->
        <tr>
          <td style="padding:0 40px 32px;">
            <a href="mailto:{payload.email}" style="display:inline-block;padding:12px 24px;background:#fff;color:#000;font-size:12px;font-weight:700;letter-spacing:2px;text-decoration:none;border-radius:8px;text-transform:uppercase;">
              Reply to {payload.name.split()[0]}
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
            """,
        )
