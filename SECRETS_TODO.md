# Secrets & Service Setup Guide

Follow these steps to wire up every external service. Takes ~30 minutes total.

---

## 1. Neon (Postgres database) — free tier

1. Go to https://console.neon.tech and sign up with GitHub
2. Create a new project → name it `recorded-by-rishik`
3. Copy the **Connection string** (postgres://...) from the dashboard
4. Add `?sslmode=require` to the end if not already present
5. Change the scheme to `postgresql+psycopg2://` (SQLAlchemy format)
6. Set as `DATABASE_URL` in backend `.env` and Render

After Neon is connected, run the initial migration:
```bash
cd backend
DATABASE_URL=your-neon-url alembic upgrade head
python -m app.seed
```

---

## 2. Clerk (Authentication) — free tier

1. Go to https://clerk.com and sign up
2. Create a new application → name it `Recorded by Rishik`
3. Enable **Email/Password** and **Google** as sign-in methods
4. Go to **API Keys** → copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → frontend `.env.local`
   - `CLERK_SECRET_KEY` → frontend `.env.local` AND backend `.env`
5. Go to **API Keys → Advanced** → copy the **JWKS URL**
   - Set as `CLERK_JWKS_URL` in backend `.env`
6. In Clerk Dashboard → **Sessions → Customize session token**:
   - Add claim: `"metadata"` → `user.public_metadata`
   - This lets the admin role be read from the JWT in the Next.js middleware

**Setting yourself as admin:**
```bash
# In Neon SQL editor or psql:
UPDATE users SET role = 'admin' WHERE email = 'r.pulipaka18@gmail.com';
```

---

## 3. Resend (Email) — free tier: 3,000 emails/month

1. Go to https://resend.com and sign up
2. Add and verify your sending domain (or use the test sandbox for dev)
3. Create an **API Key** → copy as `RESEND_API_KEY` in backend `.env`
4. Update `FROM_EMAIL` in `backend/app/services/email.py` with your verified domain

---

## 4. Google Calendar API — free

1. Go to https://console.cloud.google.com
2. Create a new project → `recorded-by-rishik`
3. Enable the **Google Calendar API**
4. Create **OAuth 2.0 credentials** (Web application type)
5. Add authorized redirect URI:
   - Local: `http://localhost:8000/api/v1/admin/settings/google-calendar/callback`
   - Production: `https://your-api.onrender.com/api/v1/admin/settings/google-calendar/callback`
6. Copy **Client ID** → `GOOGLE_CLIENT_ID` in backend `.env`
7. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET` in backend `.env`

**Connect your calendar** (do this after deploying):
1. Log into `/admin/settings` on the live site
2. Click "Connect Google Calendar"
3. Authorize with your Google account

---

## 5. Cloudinary (Image CDN) — free tier: 25 credits/month

1. Go to https://cloudinary.com and sign up
2. Go to **Dashboard** → copy:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Upload your portfolio images via the Cloudinary Media Library
4. Update image URLs in `app/data/portraits.ts`, `cars.ts`, `sport.ts`, `wildlife.ts`
   to use the Cloudinary URLs instead of local paths

---

## 6. Sentry (Error tracking) — free tier

1. Go to https://sentry.io and sign up
2. Create a new project → platform: **Next.js**
3. Copy the DSN → set as `SENTRY_DSN` in frontend (add to `sentry.client.config.ts`)
4. Create another project → platform: **Python/FastAPI**
5. Copy the DSN → set as `SENTRY_DSN` in backend `.env`

---

## 7. Render (Backend hosting) — free tier

1. Go to https://render.com and sign up with GitHub
2. New → **Web Service** → connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `pip install -r requirements.txt && alembic upgrade head`
5. Set **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from `backend/.env.example` in the Render dashboard
7. Once deployed, copy the service URL → set as `NEXT_PUBLIC_API_URL` in Vercel

---

## 8. Vercel (Frontend hosting) — free tier

1. Push this repo to GitHub (if not already)
2. Go to https://vercel.com → Import project → connect your GitHub repo
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Set `NEXT_PUBLIC_API_URL` to your Render backend URL

---

## Environment variable checklist

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/dashboard`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/dashboard`
- [ ] `NEXT_PUBLIC_API_URL`

### Backend (Render)
- [ ] `DATABASE_URL`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_JWKS_URL`
- [ ] `RESEND_API_KEY`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `SENTRY_DSN`
- [ ] `ENVIRONMENT` = `production`
- [ ] `ALLOWED_ORIGINS` = `["https://your-app.vercel.app"]`
- [ ] `API_BASE_URL` = `https://your-api.onrender.com`
