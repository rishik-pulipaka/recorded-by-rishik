# Where Did I Leave Off

> **Reading this for the first time in a new session?** Read it top-to-bottom once, then start with the **🚩 Pick Up Here First** section. That's the live thread we were mid-execution on.

Last updated: end of session **2026-05-25**.

---

## 1. Project at a glance

`rishik-p-shoots` — a full-stack photography booking + portfolio site for `recordedbyrishik.com`.

| Layer | Stack | Hosted on |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind 4, Clerk auth, LightGallery + masonry | Vercel (custom domain: `recordedbyrishik.com`) |
| Backend | FastAPI (Python), SQLModel, Resend (email), Google Calendar API | Render (`https://recorded-by-rishik-api.onrender.com`) |
| Database | Postgres on Neon | Neon |
| Images | Cloudinary (folders per gallery, auto-list via Search API) | Cloudinary |
| Auth | Clerk (Google OAuth + email/password) | Clerk |

Admin account: **`recordedbyrishik@gmail.com`** (Google sign-in).
Test client account: **`r.pulipaka18@gmail.com`**.

---

## 2. 🚩 Pick Up Here First — Google Calendar OAuth (mid-flow)

We were finishing the Google Calendar integration when the session ended. The most recent backend commit (`7a89222`) moves the OAuth callback out of the auth-protected admin router so Google's redirect actually works. **Render was still redeploying when the session ended — that may or may not be live by next session.**

### Where the flow is paused
You clicked Connect, made it past the "Google has not verified safety" warning (expected — app is in Testing mode), but landed on a JSON page reading `{"detail": "Not authenticated"}`. That was the auth-guarded callback rejecting Google's redirect. The fix (commit `7a89222`) moves the callback to the public router and redirects to `{frontend}/admin/settings?calendar=connected` after a successful exchange.

### Steps to finish, in order

1. **Verify Render has deployed `7a89222`** — Render dashboard → backend service → Events tab → most recent "Deploy live" should match `7a89222` (or newer if other commits landed since).
2. **Click Connect again** on `https://recordedbyrishik.com/admin/settings` (sign in as `recordedbyrishik@gmail.com` first).
3. Pass through the "unverified app" warning → **Advanced** → **Go to [app] (unsafe)**.
4. Grant Calendar permission.
5. You should land back on `/admin/settings?calendar=connected` with a green **Connected** badge.

### End-to-end test once Connected shows
1. Submit a booking via `/book` (use the test-client email or a different one — not the admin).
2. As admin, open `/admin` → find the booking → change status to **Confirmed**.
3. Open Google Calendar on `recordedbyrishik@gmail.com` → there should be a new event titled `📸 [Client Name] — [Shoot Type]` at the booked time.

### If the connect step still fails

Most common remaining causes:
- **Render hasn't actually deployed `7a89222` yet** — check Events tab.
- **Test user not added in Google Cloud** — go to https://console.cloud.google.com/auth/audience, add `recordedbyrishik@gmail.com` under Test users.
- **`API_BASE_URL` env var on Render still has trailing slash** — code now strips it (commit `dd06872`), but cleanup the env var to be `https://recorded-by-rishik-api.onrender.com` (no trailing slash) for hygiene.
- **Other redirect-URI mismatch** — confirm Google Cloud Console → Credentials → OAuth Client has authorized redirect URI exactly: `https://recorded-by-rishik-api.onrender.com/api/v1/admin/settings/google-calendar/callback`.

---

## 3. Open issues to fix soon

### A. Booking issues *(user mentioned, needs description)*
The user said there are booking issues they're hitting but didn't describe them in detail at session end. **At the start of the next session, ask the user: "What are the booking issues you mentioned at end of last session — what's happening, when?"** Then document them here in detail and address.

### B. Duplicate empty-email user row in Neon
The admin account (`recordedbyrishik@gmail.com`) has TWO Neon rows due to a now-fixed bug where Google OAuth sign-ins created users with empty email (fixed in commit `fb8b1b1`):
- **Real admin row**: clerk_id matches the current Clerk user, email populated, `role='admin'`. This is the one in active use.
- **Orphan row**: empty email, was promoted to admin earlier as a workaround. Has no bookings attached.

Cleanup steps (left for next session):
1. In Neon SQL editor:
   ```sql
   SELECT u.id, u.email, u.role, u.clerk_id,
          (SELECT COUNT(*) FROM bookings b WHERE b.client_id = u.id) AS booking_count
   FROM users u
   WHERE u.email IS NULL OR u.email = '';
   ```
2. Confirm `booking_count = 0` for the orphan.
3. `DELETE FROM users WHERE id = '<orphan_id>';`
4. (Optional) Also delete the matching duplicate Clerk user at https://dashboard.clerk.com → Users.
5. (Optional, recommended) Clerk dashboard → User & Authentication → Account linking → enable "Link accounts with the same email" to prevent this happening again.

### C. Cloudinary migration — final deploy step pending
The Cloudinary migration is *functionally complete locally* and live galleries on the deployed site work via Cloudinary, but the `public/images/` folder is still in the working tree. To finish:
1. Verify the live site at `recordedbyrishik.com/gallery` loads photos from `res.cloudinary.com` (right-click an image → "Open in new tab" — URL should start with `res.cloudinary.com`).
2. On Vercel → project → Environment Variables → add (if not already there):
   - `CLOUDINARY_CLOUD_NAME=div9...` (same as `.env.local`)
   - `CLOUDINARY_API_KEY=4662...`
   - `CLOUDINARY_API_SECRET=A50n...`
3. Locally: `rm -rf public/images && git add -A && git commit -m "remove local gallery images now hosted on cloudinary" && git push`.
4. Confirm Vercel redeploys and the gallery still works.

(Optional much later: purge old image blobs from git history via `git filter-repo` or BFG to shrink the ~4GB repo. Destructive — only if disk size matters.)

### D. Resend client emails — 403
- Admin email notifications work fine (to `recordedbyrishik@gmail.com`).
- Client confirmation emails (to whoever booked) fail with **403 from Resend** because Resend's sandbox only delivers to the account owner.
- Fix: verify `recordedbyrishik.com` domain in Resend dashboard → Domains → add domain → add DNS records → wait ~5 min for verification.
- Then update `FROM_EMAIL` in `backend/app/services/email.py` from `onboarding@resend.dev` to `Recorded by Rishik <noreply@recordedbyrishik.com>`.

### E. Business hours / settings UI is decorative for now
The `/admin/settings` page lets you edit business hours and notification email. These values **persist** in the `settings` table (key `business_hours_ui`) but **aren't enforced anywhere yet** — the booking flow's availability picker still uses `CalendarService.get_available_slots()` with a separate `business_hours` key (different shape) defaulting to Mon–Sat 09:00–19:00. Reconciliation is a future task — see #4 below.

---

## 4. Future work — bigger pieces, not started

- **Full admin dashboard redesign** — user has a vision for this (monitoring, booking management, client management, analytics, settings). Save for a dedicated session.
- **Reconcile business hours**: make the UI per-day shape (`business_hours_ui` key) be what `CalendarService.get_available_slots()` reads, so admin-edited hours actually affect when clients can book. Currently the two shapes are siloed.
- **About page** — disabled until user has a good photo of themselves to feature.
- **Testimonials section** — disabled until user has real testimonials to add.
- **Studio location option in booking flow** — disabled; re-enable when user has a studio.

---

## 5. What was completed in the 2026-05-25 session (in order)

### Cloudinary image migration (committed in `3149100`)
- Moved 101 gallery photos from `public/images/` (1.2GB in repo) to Cloudinary folders (`portraits`, `sport`, `cars`, `wildlife`, `architecture`).
- Created `lib/cloudinary.ts` (server, Search API) + `lib/cloudinaryLoader.ts` (client-safe loader).
- New `app/components/GalleryGrid.tsx` (client) wraps LightGallery + masonry; gallery pages became thin async server components.
- `app/page.tsx` (home hero) now rotates randomly per visit via `getHero()` (dynamic rendering); 3 portfolio tiles use `getCover(folder)` cached per ISR window.
- Tag conventions in Cloudinary:
  - `cover` = used as that folder's gallery tile (falls back to newest if no `cover` tag).
  - `hero` = used as home page hero (falls back to any random gallery photo if none tagged).
- Migration scripts: `scripts/upload-to-cloudinary.mjs` (one-time) and `scripts/add-photos.mjs` (ongoing). The latter is exposed as `npm run add-photos -- <local-path> <gallery-name>`.
- Auto-resize: any file >10MB is resized to max 3000px long edge @ q90 via `sharp` before upload (Cloudinary free tier caps single uploads at 10MB).

### Admin / Google Calendar integration (commits `1ae7b05` → `7a89222`)
- `backend/app/routers/admin.py`: added missing `GET /admin/settings` and `PATCH /admin/settings`; flipped `/google-calendar/connect` from `GET` to `POST` to match frontend.
- `backend/app/auth.py`: fixed Google OAuth users having empty email — now fetches user identity from Clerk's REST API as a fallback when JWT claims are missing. Also backfills existing empty-email rows on next request.
- `app/admin/settings/SettingsClient.tsx`: client-side fetches now send `Authorization: Bearer <Clerk token>`; trailing slash stripped from `NEXT_PUBLIC_API_URL`.
- `backend/app/services/calendar.py`: `get_auth_url()` now takes `login_hint` so Google preselects the right account; trailing slash stripped from `API_BASE_URL` in redirect URI.
- `backend/app/routers/public.py`: moved Google's OAuth callback here (no auth required, since Google's redirect can't carry a Bearer token). On successful exchange, redirects browser to `{frontend}/admin/settings?calendar=connected`. Frontend URL derived from `ALLOWED_ORIGINS`.

### Admin account & permissions (manual, no commit)
- Set Clerk public metadata `{ "role": "admin" }` for `recordedbyrishik@gmail.com`.
- Configured Clerk session token to expose `metadata`.
- Promoted the right Neon user row to `role='admin'` via `UPDATE users SET role='admin' WHERE clerk_id='...'`.
- Set Render env vars: `API_BASE_URL`, `ALLOWED_ORIGINS` (including `recordedbyrishik.com` for CORS).

---

## 6. Useful pointers for the next session

### Recent commit history (most recent first)
- `7a89222` fix: oauth callback auth-less + redirect to frontend
- `dd06872` fix: strip trailing slash from API_BASE_URL in OAuth redirect URI
- `8909b3c` feat: pre-select admin email on google calendar oauth consent
- `50f4b6f` fix: send Clerk auth token on admin/settings client-side fetches
- `fb8b1b1` fix: populate email/name for Clerk OAuth users via REST API fallback
- `1ae7b05` fix: admin settings endpoints + google calendar oauth method
- `3149100` moved images to cloud service to save space and optimize build time

### Files you'll want to know about
- `backend/app/routers/admin.py` — all admin API endpoints (settings, bookings CRUD, pricing, etc.)
- `backend/app/routers/public.py` — public endpoints, including the new Google Calendar OAuth callback at the bottom.
- `backend/app/services/calendar.py` — Google Calendar OAuth flow + event creation.
- `backend/app/auth.py` — Clerk JWT verification + Clerk REST API user fetch + admin role enforcement.
- `proxy.ts` (root) — Next.js middleware: gates `/admin/*` on `sessionClaims.metadata.role === 'admin'` (Clerk-side, not Neon).
- `app/admin/settings/SettingsClient.tsx` — the Connect Google Calendar button + business hours editor + save.
- `lib/cloudinary.ts` / `lib/cloudinaryLoader.ts` — image fetch helpers.
- `scripts/add-photos.mjs` — ongoing photo upload tool. Auto-resizes anything over 10MB.

### Env vars currently in play

**Render (backend):**
- `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_JWKS_URL`
- `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SENTRY_DSN`
- `API_BASE_URL=https://recorded-by-rishik-api.onrender.com` (no trailing slash — code now strips, but keep clean)
- `ALLOWED_ORIGINS=["http://localhost:3000","https://recordedbyrishik.com","https://www.recordedbyrishik.com"]` (CORS whitelist; also used to derive the frontend redirect target post-OAuth)

**Vercel (frontend):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, Clerk redirect URLs
- `NEXT_PUBLIC_API_URL=https://recorded-by-rishik-api.onrender.com/` (trailing slash present; code strips at use time)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **NEEDED:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (currently only in local `.env.local`; need to add to Vercel before removing `public/images/`)

### A note on the deduplicated admin account
The admin user was created via Google sign-in. Before the `fb8b1b1` fix, this resulted in a Neon `users` row with empty `email`. That orphan row is still in Neon at session end (we promoted it to admin to unblock, then a fresh sign-in created the correct populated-email row which is also admin). Cleanup is item **3.B** above.

### Git remote
The GitHub repo got renamed from `rishik-p-shoots` to `recorded-by-rishik`. Push works via redirect, but to silence the warning: `git remote set-url origin https://github.com/rishik-pulipaka/recorded-by-rishik.git`.

---

## 7. Quick recap for the user on next visit

When the user opens a new session and says "where did I leave off," summarize roughly as:

> Last session you finished the Cloudinary image migration end-to-end and got 90% through the Google Calendar integration. The actual Connect button click is the one thing left to test — Render was redeploying commit `7a89222` (the callback auth fix) when you signed off. Once that's live, click Connect on `/admin/settings`, push past the "unverified app" warning, grant calendar access, and you should see "Connected." Then test booking → confirm → calendar event.
>
> You also mentioned hitting some booking issues at end of session but didn't describe them — what are you seeing?
>
> Smaller cleanups still queued: delete the duplicate empty-email admin row in Neon, add Cloudinary env vars to Vercel + delete `public/images/`, and verify the Resend domain so client emails stop 403'ing.
