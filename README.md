# Recorded by Rishik — Photography Booking Platform

A full-stack photography booking platform built with Next.js 15, FastAPI, Neon Postgres, and Clerk auth. Clients can request instant quotes, book sessions, message the photographer, and receive gallery deliverables — all from a single polished interface.

**Live:** _set once deployed to Vercel_  
**API:** _set once deployed to Render_

---

## Features

- **Multi-step booking form** — 7-step flow with persistent state, live quote panel (optimistic local compute + backend reconciliation), and availability based on Google Calendar freebusy
- **Instant quoting** — React-side QuoteEngine mirrors backend pricing rules, gives zero-latency quote feedback before API round-trip
- **Admin dashboard** — bookings with status state machine, CRM client view (lifetime value, days since last shoot), unconverted quote recovery, pricing editor, funnel analytics, business hours, and Google Calendar OAuth
- **Client portal** — upcoming/past bookings, gallery delivery, reschedule requests, messaging thread
- **Transactional emails** — Resend for booking received (admin), booking confirmation (client), gallery ready, reminders
- **Google Calendar sync** — OAuth flow in admin settings, freebusy availability for booking form, auto-creates/deletes calendar events on booking state changes
- **Auth** — Clerk (email + Google), JWT verification on FastAPI, role-based middleware (`admin` vs `client`)
- **Database** — Neon serverless Postgres with SQLModel (SQLAlchemy + Pydantic), Alembic migrations (SQL DDL visible in `backend/alembic/versions/`)

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Server components for SEO, streaming, ISR |
| Styling | Tailwind CSS v4 | Utility-first, zero runtime |
| Auth | Clerk | Drop-in Next.js + FastAPI JWT integration, free tier |
| Backend | FastAPI (Python) | Async, typed, great DX, Pydantic already in SQLModel |
| ORM | SQLModel | SQLAlchemy DDL visible in Alembic migrations (resume evidence) |
| Database | Neon (serverless Postgres) | Free tier, no cold starts, branching |
| Email | Resend | Simple SDK, generous free tier (3k emails/mo) |
| Calendar | Google Calendar API | Free, already where shoots live |
| Images | Cloudinary (CDN) | Free tier, on-the-fly transforms |
| Deploy FE | Vercel | Next.js native, free tier |
| Deploy BE | Render | Free web service, Dockerfile support |

---

## Architecture

```
Browser
  │
  ├── Vercel (Next.js)
  │     ├── /book             — multi-step booking form (client component)
  │     ├── /dashboard        — client portal (Clerk protected)
  │     ├── /admin            — admin dashboard (Clerk + role protected)
  │     └── /sign-in, /sign-up — Clerk hosted components
  │
  └── Render (FastAPI)
        ├── /api/v1/pricing          — public pricing rules
        ├── /api/v1/quotes           — quote engine
        ├── /api/v1/availability     — Google Calendar freebusy
        ├── /api/v1/bookings         — create booking, messaging
        ├── /api/v1/me/*             — client portal API
        └── /api/v1/admin/*          — admin API (role-gated)

Neon Postgres ──────────────────────────── FastAPI (SQLModel)
Clerk ──── JWT ────────────────────────── FastAPI auth middleware
Google Calendar ──── OAuth refresh token ─ FastAPI calendar service
Resend ──────────────────────────────────── FastAPI email service
```

**Auth flow:**
1. User signs in via Clerk on the Next.js frontend
2. Clerk issues a JWT with `metadata.role` claim
3. Next.js middleware (`middleware.ts`) checks the claim — redirects non-admins away from `/admin/*`
4. API calls from the frontend include `Authorization: Bearer <token>`
5. FastAPI `auth.py` fetches Clerk JWKS (TTL-cached 10 min), verifies the JWT, upserts the user row on first login

**Booking state machine:**
```
pending_confirmation → confirmed → deposit_paid → completed
                    ↘ cancelled
                    ↘ archived
```
Every state transition writes a `BookingEvent` row (audit log).

---

## Local dev setup

### Prerequisites
- Node.js 20+
- Python 3.12+
- A Neon project (free) and Clerk app (free) — see `SECRETS_TODO.md`

### Frontend

```bash
# Install dependencies
npm install

# Create .env.local from example
cp .env.example .env.local
# Fill in Clerk keys and NEXT_PUBLIC_API_URL=http://localhost:8000

# Run dev server
npm run dev
```

### Backend

```bash
cd backend

# Create virtualenv
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Fill in DATABASE_URL, CLERK_SECRET_KEY, CLERK_JWKS_URL (see SECRETS_TODO.md)

# Run migrations and seed pricing rules
alembic upgrade head
python -m app.seed

# Start API
uvicorn app.main:app --reload --port 8000
```

---

## Database schema

Managed via Alembic — the full SQL DDL is in `backend/alembic/versions/`. Key tables:

| Table | Purpose |
|---|---|
| `user` | Clerk-linked users, role: `client` \| `admin` |
| `pricingrule` | Shoot types, packages, add-ons, modifiers |
| `booking` | State machine, FK to user + package |
| `bookingaddon` | Junction: booking ↔ pricing rule |
| `bookingevent` | Immutable audit log for every state change |
| `quote` | Pre-booking quote snapshots (lead tracking) |
| `message` | Per-booking message thread |
| `deliverable` | Gallery URL delivery per booking |
| `setting` | KV store for business hours, calendar tokens |

---

## Deployment

See `SECRETS_TODO.md` for step-by-step instructions. Summary:

1. Push repo to GitHub
2. Create Neon project → copy `DATABASE_URL`
3. Create Clerk app → copy keys, configure JWKS
4. Deploy backend to Render (root dir: `backend`) → set env vars
5. Deploy frontend to Vercel → set env vars with Render URL as `NEXT_PUBLIC_API_URL`
6. Set yourself as admin in Neon SQL editor:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
7. Log into `/admin/settings` → connect Google Calendar

---

## Project structure

```
.
├── app/                    # Next.js App Router
│   ├── (auth)/             # Clerk sign-in / sign-up pages
│   ├── admin/              # Admin dashboard (protected)
│   ├── book/               # Multi-step booking form
│   ├── dashboard/          # Client portal (protected)
│   ├── gallery/            # Photo galleries by category
│   ├── services/           # Services & pricing page
│   ├── contact/            # Contact form
│   └── ...
├── lib/
│   ├── pricing.ts          # Local pricing constants (mirrors DB seed)
│   └── api.ts              # Typed fetch wrapper for FastAPI
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app, CORS, routers
│   │   ├── auth.py         # Clerk JWT verification, user upsert
│   │   ├── db.py           # Neon connection, session dep
│   │   ├── models/         # SQLModel table definitions
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── routers/        # public, client, admin route handlers
│   │   ├── services/       # QuoteEngine, CalendarService, EmailService
│   │   └── seed.py         # Default pricing rules
│   ├── alembic/            # Migrations (SQL DDL here for resume)
│   ├── Dockerfile
│   └── render.yaml
├── middleware.ts            # Clerk route protection
├── .env.example
└── SECRETS_TODO.md
```
