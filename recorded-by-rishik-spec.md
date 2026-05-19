# Recorded by Rishik — Build Specification

> **Document purpose:** This is the source-of-truth spec for completing the Recorded by Rishik photography booking platform. It is written to be handed to Claude Code, which has access to the live codebase. Claude Code's job: audit what exists, identify gaps against this spec, and implement everything missing to bring the project to a polished, client-ready state that the owner (Rishik) actually uses to run his photography business.

---

## 1. Context & Goals

### 1.1 What this project is
A live, full-stack SaaS-style photography booking platform for **Rishik Pulipaka's own photography business**. The owner is also the operator. Real clients book real shoots through it. It is simultaneously:
- A working business tool Rishik uses to manage bookings, quotes, calendar, and clients.
- A flagship portfolio piece backing resume claims for SWE/PM internships.

### 1.2 Stated resume claims this build must make true
From the current resume:

> *Bootstrapped and launched a live full-stack SaaS photography platform deployed on Vercel, scaling to 8+ paying clients within 2 months via 10+ user discovery interviews that shaped a roadmap with automated calendar sync and dynamic instant quoting*

> *Architected a Next.js/TypeScript frontend, Python/FastAPI REST API, and relational SQL schema managing auth, scheduling, and transactions to support a growing customer base*

**Every concrete capability claimed above must exist and demonstrably work in the codebase.** No vaporware. Specifically:
- Live deployment on Vercel ✅ required
- Automated calendar sync ✅ required
- Dynamic instant quoting ✅ required
- Next.js/TypeScript frontend ✅ required
- Python/FastAPI REST API ✅ required
- Relational SQL schema ✅ required
- Auth ✅ required
- Scheduling ✅ required
- Transactions (booking transactions, not necessarily payments) ✅ required

### 1.3 Constraints (non-negotiable)
- **Stack:** Next.js + TypeScript (frontend), Python + FastAPI (backend), relational SQL (Postgres preferred — Supabase, Neon, or Vercel Postgres all work).
- **Deployment:** Frontend on Vercel. FastAPI must be reachable from Vercel — preferred: deploy backend on Render, Railway, or Fly.io free tier; or as Python serverless functions on Vercel if feasible.
- **Cost:** Free or near-free tier services only. No paid APIs unless absolutely required to fulfill a resume claim, and only after flagging it to Rishik.
- **Secrets:** Leave `.env.example` and a clear `SECRETS_TODO.md` for Rishik to populate. Never commit real secrets.

### 1.4 Polish bar
Client-ready. This is what the world sees when a paying client lands on the booking page. It should look intentional, load fast, work on mobile, handle errors gracefully, and feel like a real product — not a class project.

---

## 2. How Claude Code Should Approach This

### 2.1 Phase 0 — Audit before building
Before writing new code, Claude Code MUST:
1. Read the full codebase. Map what exists: pages, components, API routes, database models, auth state, deployment config.
2. Produce a written audit at `/AUDIT.md` in the repo root listing, for each feature in Section 3 below:
   - **Status:** Done / Partial / Missing
   - **Evidence:** file paths and brief description of what's there
   - **Gap:** what's needed to call it done
3. Stop after the audit and **summarize findings to Rishik before implementing**, unless Rishik has explicitly told you to proceed end-to-end without check-in.

### 2.2 Phase 1+ — Implementation order
Implement in this priority order. Each phase should be a separate commit (or PR-sized chunk) so Rishik can review incrementally:

1. **Foundation** — database schema, env setup, auth, deployment wiring
2. **Core booking flow** — public-facing booking + instant quoting
3. **Calendar sync** — Google Calendar integration
4. **Admin dashboard** — Rishik's view to manage everything
5. **Client portal** — logged-in client view of their bookings
6. **Polish & hardening** — error states, loading states, mobile, SEO, analytics
7. **Documentation** — README, architecture doc, deployment guide

### 2.3 Code quality expectations
- TypeScript strict mode on. No `any` unless justified in a comment.
- FastAPI with Pydantic models for every request/response.
- Server components by default in Next.js App Router; client components only when needed.
- Tailwind for styling; component primitives via shadcn/ui acceptable.
- Form validation with Zod (frontend) and Pydantic (backend).
- Error boundaries on every route group.
- Loading and empty states for every async UI.
- Mobile-first responsive design — test at 375px width.
- Accessibility: semantic HTML, ARIA where needed, keyboard nav works, contrast passes WCAG AA.

---

## 3. Feature Specification

### 3.1 Public marketing site

**Pages:**
- `/` — Hero, portfolio highlights, services preview, social proof, CTA to book
- `/portfolio` — Gallery, filterable by shoot type (portrait, event, product, etc.)
- `/services` — Service tiers with starting prices, what's included, sample deliverables
- `/about` — Rishik's story, gear, approach
- `/contact` — Inquiry form (lighter weight than full booking)
- `/book` — Full booking flow (Section 3.3)

**Requirements:**
- Photography-heavy site. Images must be optimized via Next.js `<Image>` component with proper sizing, blur placeholders, and lazy loading.
- Image storage: use a free CDN — Cloudinary free tier or Supabase Storage. Do not commit large images to the repo.
- SEO: per-page metadata, OpenGraph tags, sitemap.xml, robots.txt.
- Page load: under 2.5s LCP on 4G mobile. Run Lighthouse and target 90+ on Performance, Accessibility, Best Practices, SEO.

### 3.2 Authentication

**Roles:**
- `admin` — Rishik. Full access to dashboard, all bookings, all clients.
- `client` — Paying or prospective clients. Sees only their own bookings and quotes.

**Implementation:**
- Use a managed auth provider with a free tier — recommended: **Clerk** (generous free tier, easy Next.js integration) or **Supabase Auth** (if using Supabase for DB).
- Email/password + Google OAuth (clients often expect Google sign-in).
- Email verification required for clients.
- Admin role assigned manually via DB flag — not via signup flow.
- Session handling on both Next.js (middleware) and FastAPI (JWT verification middleware).

### 3.3 Booking & instant quoting flow

This is the headline feature. It needs to work flawlessly.

**Flow:**
1. Client lands on `/book`.
2. Step 1: Select shoot type (portraits, event, product, real estate, other).
3. Step 2: Select package/duration (e.g., 30min / 1hr / 2hr / half-day / full-day).
4. Step 3: Add-ons (extra edits, rush delivery, second location, etc.) — each with price and toggle.
5. Step 4: Date and time picker — only shows slots where Rishik is actually available (see calendar sync, 3.4).
6. Step 5: Location input (address or "studio" / "client's choice").
7. Step 6: Contact info + any special notes.
8. **Live quote panel** updates in real time on every step, showing line-item breakdown and total.
9. Step 7: Review and submit. Creates a `booking` record with status `pending_confirmation` and sends Rishik a notification.

**Quoting engine (backend, FastAPI):**
- A `QuoteEngine` service that takes a structured request (shoot type, duration, add-ons, date modifiers, location modifiers) and returns a quote with line items.
- Pricing rules stored in DB (`pricing_rules` table), not hardcoded — so Rishik can update without redeploy.
- Modifiers: weekend surcharge, holiday surcharge, travel fee beyond X miles (use a geocoding API only if free — otherwise zip-code-band pricing).
- Returns: `{ line_items: [...], subtotal, modifiers: [...], total, currency, valid_until }`.

**Frontend:**
- Multi-step form using React Hook Form + Zod. Persist progress to `sessionStorage` so a refresh doesn't lose state.
- Quote panel uses optimistic UI — recompute locally on every change, then reconcile with backend on step transitions.

### 3.4 Calendar sync (automated)

**Integration:** Google Calendar API (free).

**Behavior:**
- Rishik connects his Google Calendar once via OAuth (admin setting).
- The booking flow's time picker queries the backend, which queries Google Calendar's freebusy endpoint to determine real availability for the requested date range.
- On booking confirmation, the system creates an event on Rishik's calendar with client name, location, package, and a link to the booking detail page.
- On cancellation or reschedule, the event updates or deletes accordingly.

**Implementation notes:**
- Store OAuth refresh token securely (DB, encrypted column or use Supabase Vault).
- Cache freebusy results for 5 minutes to avoid rate-limit issues.
- Define business hours in admin settings (default Mon–Sat 9am–7pm) — sync only respects free slots inside those hours.

### 3.5 Transactions / payments

The resume says "transactions" — the most defensible interpretation is **booking transactions** (the financial agreement and deposit). Full payment processing is a stretch goal.

**Minimum viable (must do):**
- `bookings` table records the agreed total, deposit amount, and balance due.
- Booking state machine: `pending_confirmation → confirmed → deposit_paid → completed → archived` (plus `cancelled` from any state).
- All state transitions logged in a `booking_events` audit table.
- Admin can manually mark deposit/balance paid (for clients who Venmo/Zelle Rishik).

**Stretch (recommended for client-ready bar):**
- **Stripe integration** for online deposit payment. Stripe has no monthly fee — only per-transaction. This is the one paid service worth integrating because it directly fulfills the "transactions" resume claim with the strongest possible evidence.
- If Stripe is added: payment intent created on booking confirmation, webhook updates booking state, receipt emailed to client.
- **Flag this to Rishik before doing it** — he may want to wire his own Stripe account.

### 3.6 Admin dashboard

**Route:** `/admin` (protected, admin-only).

**Views:**
- **Overview** — Upcoming shoots (next 7 days), pending confirmations, revenue this month, total clients.
- **Bookings** — Filterable table of all bookings, click into detail, change status, add internal notes.
- **Calendar** — Week and month view of bookings overlaid with calendar availability.
- **Clients** — List of all clients, click into client profile showing their booking history and lifetime value.
- **Quotes** — Quotes that were generated but never converted to bookings (lead recovery).
- **Pricing** — Edit `pricing_rules` (shoot types, packages, add-ons, modifiers). Form-driven, no DB access required.
- **Settings** — Business hours, calendar connection status, notification preferences.

### 3.7 Client portal

**Route:** `/dashboard` (protected, client role).

**Views:**
- **My bookings** — Upcoming and past bookings, with status badges.
- **Booking detail** — Full info on a specific booking, including ability to message Rishik, request reschedule, view quote breakdown, see deliverables when ready.
- **Profile** — Update contact info, password.

### 3.8 Deliverables handoff

After a shoot, clients need their photos.

**Minimum:**
- Booking detail page has a "Deliverables" section.
- Admin can attach a link to a Google Drive / Dropbox / Pixieset gallery for that booking.
- Client gets an email notification when deliverables are ready.

**Optional polish:**
- Direct gallery embed instead of an external link.

### 3.9 Notifications

- **Booking received** → email Rishik, email client confirmation.
- **Booking confirmed** → email client.
- **Reminder 48h before shoot** → email client + Rishik.
- **Deliverables ready** → email client.
- **Booking cancelled** → email both parties.

Use **Resend** free tier (3,000 emails/month free) for transactional email. React Email templates for consistent design.

### 3.10 Analytics

- Vercel Analytics (free) for traffic.
- Google Analytics 4 (free) configured with custom events:
  - `quote_started`
  - `quote_completed`
  - `booking_submitted`
  - `booking_confirmed`
  - `portfolio_image_viewed`
  - `contact_form_submitted`
- A lightweight internal events log in DB for funnel analysis Rishik can query.

---

## 4. Database Schema

Use Postgres. ORM: SQLAlchemy or SQLModel on the FastAPI side. Migrations via Alembic.

**Core tables:**

- `users` — id, email, name, phone, role (admin/client), auth_provider_id, created_at, updated_at
- `pricing_rules` — id, rule_type (shoot_type/package/addon/modifier), name, description, base_price, unit, active, metadata (JSON)
- `bookings` — id, client_id (FK users), shoot_type, package_id, start_time, end_time, location, special_notes, status (enum), quote_total, deposit_amount, balance_paid, calendar_event_id, created_at, updated_at
- `booking_addons` — id, booking_id, pricing_rule_id, quantity, price_snapshot
- `booking_events` — id, booking_id, event_type, payload (JSON), created_at, created_by
- `quotes` — id, session_id, user_id (nullable), shoot_type, package_id, addons (JSON), total, valid_until, converted_to_booking_id (nullable), created_at
- `messages` — id, booking_id, sender_id, body, read_at, created_at
- `deliverables` — id, booking_id, gallery_url, notes, delivered_at
- `settings` — id, key, value (JSON) — for business hours, calendar tokens, etc.

All timestamps `TIMESTAMPTZ`. All FKs indexed. Soft-delete via `deleted_at` on `bookings` and `users` only.

---

## 5. API Surface (FastAPI)

Group by resource. All routes prefixed `/api/v1`.

**Public:**
- `GET /pricing` — current pricing rules
- `POST /quotes` — generate a quote from a request body
- `GET /availability?from=&to=` — calendar availability
- `POST /bookings` — submit a booking (creates with `pending_confirmation`)
- `POST /contact` — contact form submission

**Authenticated (client):**
- `GET /me` — current user
- `GET /me/bookings` — my bookings
- `GET /bookings/{id}` — booking detail (owner only)
- `POST /bookings/{id}/messages` — send message
- `POST /bookings/{id}/reschedule-request`

**Authenticated (admin):**
- `GET /admin/bookings` — all bookings, with filters
- `PATCH /admin/bookings/{id}` — update status, notes, etc.
- `GET /admin/clients`
- `GET /admin/quotes` — unconverted quotes
- `POST /admin/pricing-rules` / `PATCH` / `DELETE`
- `GET /admin/analytics/funnel`
- `POST /admin/settings/google-calendar/connect` — OAuth start
- `POST /admin/settings/google-calendar/callback`

Every endpoint: typed request and response with Pydantic. OpenAPI auto-docs enabled at `/docs` (admin-gated in production).

---

## 6. Deployment

**Frontend (Next.js):**
- Vercel. Connect GitHub repo, auto-deploy on `main`.
- Environment variables set in Vercel dashboard.

**Backend (FastAPI):**
- Recommended: **Render** free tier web service. Auto-deploys from GitHub.
- Alternative: **Railway** ($5 free credit/month) or **Fly.io** (free tier).
- Provide a `Dockerfile` and `render.yaml` (or equivalent).

**Database:**
- **Supabase** (free tier: 500MB Postgres, generous) or **Neon** (free tier: serverless Postgres).

**Files/images:**
- Cloudinary free tier (25 credits/month) or Supabase Storage.

**Monitoring:**
- Vercel Analytics built-in.
- Sentry free tier on both frontend and backend for error tracking.

---

## 7. Overall Improvements (Beyond the Resume Claims)

Things Claude Code should propose or implement to make this a stunning portfolio piece:

1. **Brand system** — Pick a consistent type pair, color palette, and motion language. Photographers' sites live and die by aesthetics. Reference: Pixieset, Format, Squarespace's photography templates. Have an opinion.
2. **Hero with motion** — Subtle parallax or video loop in the hero. Used tastefully, not aggressively.
3. **Image lightbox** — Click any portfolio image to open in a full-screen lightbox with keyboard nav.
4. **Testimonials with photos** — Real client quotes with their headshots (with permission).
5. **Case studies** — 2–3 deep "behind the shoot" pages. Great for SEO and shows the work, not just the photos.
6. **Booking confirmation page that wows** — After a successful booking, a beautifully designed confirmation page with what happens next. Last impression matters.
7. **Smart form defaults** — If a returning client books again, prefill everything from their profile.
8. **Quote shareability** — A quote can be sent as a unique link the client can review and accept/decline without logging in.
9. **Internal CRM signals** — In the admin client view, show "first contact date", "lifetime value", "average shoot value", "days since last shoot". Demonstrates product/data thinking.
10. **Booking funnel analytics page** — Admin can see where prospects drop off in the booking flow. Demonstrates PM thinking and is great resume fodder ("instrumented funnel analytics, identified 32% drop-off at step 4...").
11. **README that recruiters will actually read** — Architecture diagram, problem statement, design decisions, screenshots, demo video. This is the single highest-leverage doc you can write.
12. **`/architecture` page** — A real `ARCHITECTURE.md` describing how the system is put together. Recruiters love this.
13. **Mobile UX pass** — Photographers' clients are often on phones. Test every flow on mobile and fix anything janky.
14. **Accessibility audit** — Run axe DevTools, fix anything that's not WCAG AA.
15. **Performance budget** — Define and enforce a perf budget. Document it in the README.

---

## 8. Definition of Done

This project is "done" when:
- [ ] Audit doc exists at `/AUDIT.md` showing the gap analysis before work started.
- [ ] All Section 3 features (3.1–3.10) work end-to-end on the deployed environment.
- [ ] All resume claims from Section 1.2 are demonstrably true on the live site.
- [ ] Rishik can run his actual photography business from `/admin`.
- [ ] A real client can land on the homepage, get a quote, book a shoot, pay a deposit (if Stripe is wired), receive confirmation, and later receive deliverables — without Rishik touching the database.
- [ ] Lighthouse scores ≥ 90 on all four categories on the homepage and `/book`.
- [ ] Mobile parity: every flow works at 375px width.
- [ ] README with architecture diagram, screenshots, design decisions, and demo video link.
- [ ] `ARCHITECTURE.md` exists and is genuinely useful.
- [ ] No console errors in production. No hardcoded secrets. No TODO comments left without owner.
- [ ] Sentry is wired and verified to capture a test error.

---

## 9. Reporting Back

After each phase, Claude Code should commit and post a short summary in chat covering:
- What was built
- What was skipped/deferred and why
- Any decisions made that Rishik should review
- What's next

If Claude Code hits a fork in the road (e.g., "should we use Clerk or Supabase Auth?"), it should **ask Rishik**, not silently pick.

---
