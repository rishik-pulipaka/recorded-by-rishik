npm# Recorded by Rishik — Pre-Build Audit

> Generated: 2026-05-18. Auditor: Claude Code.
> Purpose: Map every feature in Spec §3 to Done / Partial / Missing before any implementation begins.

---

## Summary

| Category | Done | Partial | Missing |
|---|---|---|---|
| §3.1 Public marketing site | — | 3 pages | 3 pages |
| §3.2 Authentication | — | — | ✗ |
| §3.3 Booking & instant quoting | — | ✓ shell | — |
| §3.4 Calendar sync | — | — | ✗ |
| §3.5 Transactions / payments | — | — | ✗ |
| §3.6 Admin dashboard | — | — | ✗ |
| §3.7 Client portal | — | — | ✗ |
| §3.8 Deliverables handoff | — | — | ✗ |
| §3.9 Notifications (email) | — | — | ✗ |
| §3.10 Analytics | — | ✓ partial | — |
| §4 Database schema | — | — | ✗ |
| §5 FastAPI surface | — | — | ✗ |
| §6 Deployment | — | ✓ FE only | — |

**Bottom line:** The entire backend (FastAPI, database, auth, calendar, email) is absent. The frontend is a gallery portfolio with a non-functional booking shell. Roughly 15% of the spec is implemented.

---

## What exists (full inventory)

```
app/
  page.tsx                  — Homepage hero
  layout.tsx                — Root layout (Navbar, Footer, Vercel Analytics)
  about/page.tsx            — About page (placeholder content)
  gallery/page.tsx          — Gallery index (4 categories)
  gallery/portraits/        — Masonry + lightgallery, 46 images
  gallery/cars/             — Masonry + lightgallery, 20 images
  gallery/sport/            — Masonry + lightgallery
  gallery/wildlife/         — Masonry + lightgallery
  gallery/architecture/     — stub (commented out in gallery index)
  booking/page.tsx          — Booking form (client-side only, no backend)
  components/Navbar.tsx     — Responsive navbar with Framer Motion
  components/Footer.tsx     — Footer with social icons
  components/Title.tsx      — Page title component
  data/{portraits,cars,sport,wildlife,architecture}.ts — Image data
  data/navigation.ts        — Nav items (booking link commented out)
  globals.css               — Tailwind v4, 2 CSS custom properties

public/
  images/covers/            — Cover images (committed to repo)
  images/portraits/         — 46 portrait images (committed to repo)
  images/cars/              — 20 car images (committed to repo)
  (sport/wildlife images not checked but assumed present)

Stack: Next.js 15 + TypeScript + Tailwind v4 + Vercel Analytics
No backend. No database. No auth. No API routes.
```

---

## §3.1 — Public marketing site

### `/` — Homepage
**Status: Partial**

Evidence: `app/page.tsx`

What exists: Full-screen hero image with tagline ("where memories meet masterpieces") and a "gallery →" link.

Gaps:
- No portfolio highlights section (spec: "portfolio highlights")
- No services preview section
- No social proof / testimonials
- No CTA to `/book` (nav link to booking is commented out in `navigation.ts`)
- No page metadata / OpenGraph tags
- A stray `.w-full.min-h-1000px.` CSS selector string is rendered as literal text in the hero (line 21 of `app/page.tsx`) — this is a live bug

### `/gallery` (spec calls it `/portfolio`)
**Status: Partial**

Evidence: `app/gallery/page.tsx`, `app/gallery/*/page.tsx`

What exists: Gallery index with 4 categories (sport, portraits, wildlife, cars). Each sub-gallery uses react-masonry-css + lightgallery. Lightbox works. Context menu disabled (image protection). Images are imported as static assets from `public/`.

Gaps:
- Route is `/gallery`, spec wants `/portfolio`
- No single filterable gallery — user navigates to separate pages per category
- No alt text on any gallery images (all `alt=""`) — accessibility failure
- Images stored in `public/` and committed to git — spec requires CDN (Cloudinary/Supabase Storage)
- No per-image captions, shoot type tags, or metadata

### `/services`
**Status: Missing**

No file. No route. Not linked from nav.

### `/about`
**Status: Partial**

Evidence: `app/about/page.tsx`

What exists: Layout with an image slot and a paragraph of copy.

Gaps:
- Profile image is `blank_profile_picture.webp` — placeholder, not Rishik's actual photo
- No gear section, no approach section
- Not linked from navbar (navigation.ts only has home, about, gallery)
- No page metadata

### `/contact`
**Status: Missing**

No file. No route. Not linked from nav.

### `/book`
**Status: Partial** (see §3.3 for detailed breakdown)

Route exists as `/booking`. Not linked from nav (commented out).

### SEO / metadata / performance
**Status: Missing**

- No `metadata` exports on any page
- No OpenGraph tags
- No `sitemap.xml`
- No `robots.txt`
- No `<html lang>` set in metadata (set in layout but as inline attribute only)
- Lighthouse not run; unknown score
- Images committed to repo (not CDN) — large bundle, likely poor LCP

---

## §3.2 — Authentication
**Status: Missing**

No auth provider installed (no Clerk, no Supabase Auth, no NextAuth).
No `middleware.ts`.
No `users` table or schema.
No role system.
No session handling.
No protected routes.

Dependencies not installed: none of the auth packages appear in `package.json`.

---

## §3.3 — Booking & instant quoting flow
**Status: Partial (shell only — no backend, no persistence)**

Evidence: `app/booking/page.tsx`

### What exists
- Single-page form (not multi-step as spec requires)
- Session type dropdown with 12 options (headshots and modeling — different categories than spec's portraits/event/product/real estate)
- Date picker (HTML `<input type="date">`)
- Time picker (static dropdown, 9am–8pm, no real availability check)
- Contact info fields (name, email, phone, notes)
- Basic price estimate computed in `useEffect` from hardcoded `PRICING` const
- On submit: validates locally, shows a confirmation UI within the page

### Critical bugs
- **No `"use client"` directive** — file uses `useState`, `useEffect`, and event handlers but lacks the directive required by Next.js App Router. This means the page crashes or renders incorrectly.
- `handleInputChange` typed as `(e) => void` — implicit `any`, fails TypeScript strict mode
- `rows="4"` on `<textarea>` is a string; React expects a number

### Spec gaps
| Spec requirement | Status |
|---|---|
| Multi-step form (7 steps) | ❌ Single flat form |
| Step 1: shoot type (portraits/event/product/real estate/other) | ❌ Different categories (headshot/modeling) |
| Step 2: package/duration (30min–full day) | ❌ Missing |
| Step 3: add-ons with toggles | ❌ Missing |
| Step 4: date/time with real availability | ❌ Static picker, no calendar check |
| Step 5: location input | ❌ Missing |
| Step 6: contact info | ✅ Present |
| Live quote panel (real-time) | ❌ Static price at bottom, not a panel |
| Step 7: review + submit to backend | ❌ No backend call |
| sessionStorage persistence on refresh | ❌ Missing |
| React Hook Form + Zod validation | ❌ Plain useState + manual validation |
| Backend QuoteEngine | ❌ No backend |
| Pricing rules in DB (not hardcoded) | ❌ Hardcoded in frontend |
| Booking record in DB (`pending_confirmation`) | ❌ No DB |
| Notification to Rishik on submit | ❌ No email |
| Optimistic UI reconciled with backend | ❌ No backend |

---

## §3.4 — Calendar sync (Google Calendar)
**Status: Missing**

No Google Calendar API integration.
No OAuth flow.
No freebusy endpoint call.
No calendar event creation on booking confirmation.
No settings for business hours.
No token storage.

---

## §3.5 — Transactions / payments
**Status: Missing**

No `bookings` table.
No `booking_events` audit table.
No booking state machine.
No deposit/balance tracking.
No Stripe.
No manual payment marking.

---

## §3.6 — Admin dashboard
**Status: Missing**

No `/admin` route.
No protected admin views.
No bookings management.
No calendar view.
No clients list.
No quotes recovery view.
No pricing editor.
No settings panel.
No Google Calendar connection UI.

---

## §3.7 — Client portal
**Status: Missing**

No `/dashboard` route.
No "my bookings" view.
No booking detail view.
No messaging.
No reschedule request.
No profile editing.

---

## §3.8 — Deliverables handoff
**Status: Missing**

No deliverables section.
No gallery link attachment.
No email notification on delivery.

---

## §3.9 — Notifications (email)
**Status: Missing**

No Resend integration.
No React Email templates.
No transactional emails of any kind (booking received, confirmed, reminder, deliverables, cancellation).

---

## §3.10 — Analytics
**Status: Partial**

| Requirement | Status |
|---|---|
| Vercel Analytics (traffic) | ✅ `@vercel/analytics` installed, `<Analytics />` in layout |
| Google Analytics 4 | ❌ Not configured |
| `quote_started` custom event | ❌ Missing |
| `quote_completed` custom event | ❌ Missing |
| `booking_submitted` custom event | ❌ Missing |
| `booking_confirmed` custom event | ❌ Missing |
| `portfolio_image_viewed` custom event | ❌ Missing |
| `contact_form_submitted` custom event | ❌ Missing |
| Internal DB events log | ❌ No DB |

---

## §4 — Database schema
**Status: Missing**

No Postgres database.
No ORM (SQLAlchemy / SQLModel).
No Alembic migrations.
None of the specified tables exist: `users`, `pricing_rules`, `bookings`, `booking_addons`, `booking_events`, `quotes`, `messages`, `deliverables`, `settings`.

---

## §5 — API surface (FastAPI)
**Status: Missing**

No FastAPI project.
No Python code.
No `/api/v1` routes.
No Pydantic models.
Not a single endpoint exists.

---

## §6 — Deployment
**Status: Partial**

| Requirement | Status |
|---|---|
| Frontend on Vercel | ✅ Likely (Vercel Analytics installed, standard Next.js setup) |
| Auto-deploy on `main` | ✅ Assumed (GitHub repo exists) |
| FastAPI backend on Render/Railway/Fly | ❌ No backend |
| `Dockerfile` | ❌ Missing |
| `render.yaml` | ❌ Missing |
| Database (Supabase / Neon) | ❌ Not configured |
| Image CDN (Cloudinary / Supabase Storage) | ❌ Images in repo |
| `.env.example` | ❌ Missing |
| `SECRETS_TODO.md` | ❌ Missing |
| Sentry (frontend + backend) | ❌ Not installed |

---

## Code quality issues (§2.3)

| Requirement | Status |
|---|---|
| TypeScript strict mode | ✅ `"strict": true` in tsconfig.json |
| No implicit `any` | ❌ `handleInputChange(e)` in booking/page.tsx is untyped |
| Pydantic everywhere (backend) | ❌ No backend |
| Server components by default | ❌ Booking page uses state hooks without `"use client"` |
| Tailwind for styling | ✅ Tailwind v4 |
| shadcn/ui | ❌ Not installed |
| Zod validation (frontend) | ❌ Not installed |
| Error boundaries | ❌ None |
| Loading states | ❌ None |
| Empty states | ❌ None |
| Mobile-first responsive | ⚠️ Partial (some responsive classes, not tested at 375px) |
| Accessibility (WCAG AA) | ❌ All gallery images have `alt=""`, no ARIA |

---

## Blocking bug to fix before any new code

`app/booking/page.tsx` is missing `"use client"` at the top. It will silently fail or throw a hydration error in Next.js 15 App Router because it calls `useState` and `useEffect` in what is treated as a Server Component. This must be the first line added before anything else runs.

---

## Resume claims vs. reality

| Resume claim | Reality |
|---|---|
| "Live full-stack SaaS platform" | Frontend only — no backend, no database |
| "Deployed on Vercel" | Frontend likely deployed; no backend |
| "Automated calendar sync" | Does not exist |
| "Dynamic instant quoting" | Hardcoded frontend price estimate, no engine |
| "Next.js/TypeScript frontend" | ✅ Exists |
| "Python/FastAPI REST API" | Does not exist |
| "Relational SQL schema" | Does not exist |
| "Auth" | Does not exist |
| "Scheduling" | Does not exist |
| "Transactions" | Does not exist |

---

## Implementation priority (as gap analysis informs §2.2 phases)

1. **Foundation** — FastAPI project, Postgres schema (Neon/Supabase), auth (Clerk recommended), env setup, deployment wiring (Render + Dockerfile)
2. **Core booking flow** — Multi-step form, QuoteEngine backend, booking DB record, Resend email
3. **Calendar sync** — Google Calendar OAuth + freebusy + event creation
4. **Admin dashboard** — `/admin` with bookings, clients, pricing editor, settings
5. **Client portal** — `/dashboard`, booking detail, messaging
6. **Polish** — SEO metadata, sitemap, CDN images, error boundaries, loading states, GA4, Sentry, Lighthouse
7. **Documentation** — README, ARCHITECTURE.md, demo video

---

*End of audit. Awaiting Rishik's confirmation before any implementation begins.*
