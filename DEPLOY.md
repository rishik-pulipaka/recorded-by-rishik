# Deployment Guide

## Vercel Environment Variables

The app will show "Internal Server Error" on Vercel if these are not set.

Go to: **Vercel Dashboard → Project → Settings → Environment Variables**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` from Clerk dashboard |
| `CLERK_SECRET_KEY` | `sk_live_...` from Clerk dashboard |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` |
| `NEXT_PUBLIC_API_URL` | Your backend URL (e.g. `https://your-api.onrender.com`) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Your `G-XXXXXXXXXX` GA4 ID (optional) |

**Where to get Clerk keys:**
Clerk Dashboard (dashboard.clerk.com) → your app → API Keys
Use `pk_live_` / `sk_live_` keys for production, `pk_test_` / `sk_test_` for preview/staging.

After adding variables, Vercel will prompt a redeploy — do that and the site will work.

---

## Local Development

Create a `.env.local` file in the project root (copy from `.env.example`):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

Then run:
```
npm run dev
```

---

## Build & Deploy Checklist

- [ ] Env vars set in Vercel (see above)
- [ ] `npm run build` passes locally with no errors or warnings
- [ ] Push to `main` branch — Vercel auto-deploys on push

---

## Notes

- `proxy.ts` is the Next.js 16 equivalent of `middleware.ts` — handles Clerk auth on all routes
- `.env.local` is gitignored and never committed — keep your secret keys out of the repo
- If Vercel build fails, check the build logs under **Vercel Dashboard → Deployments → [latest] → Build Logs**
