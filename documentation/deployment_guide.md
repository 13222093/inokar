# LiqUIFI Deployment Guide

## Prerequisites

Before deploying, you need:
1. **A GitHub repo** — push your code to GitHub
2. **A PostgreSQL database** — hosted (not local)
3. **A Node.js host** — for the Express API
4. **A static host** — for the React frontend (or serve from the same server)

---

## Step 0: Push to GitHub

```bash
cd c:\Users\Ari Azis\Downloads\liquifi
git init
git add .
git commit -m "Initial commit: LiqUIFI Dashboard"
git remote add origin https://github.com/YOUR_USERNAME/liquifi.git
git push -u origin main
```

> **IMPORTANT:** Add `server/.env` to `.gitignore` before pushing — it contains secrets.

---

## Deployment Options

### Option A: Full-Stack on Railway (Recommended, Simplest)

**Cost:** Free trial ($5/month after) — hosts frontend, backend, AND database in one place.

| Step | Action |
|------|--------|
| 1 | Go to railway.app → Sign in with GitHub |
| 2 | **New Project** → "Deploy from GitHub repo" → select `liquifi` |
| 3 | **Add PostgreSQL** → Click "+ New" → "Database" → "PostgreSQL" |
| 4 | Railway auto-provides `DATABASE_URL` — copy it |
| 5 | **Backend service**: Set root directory to `server/`, add env vars (see below) |
| 6 | **Frontend service**: Set root directory to `./`, build command: `npm run build`, output: `dist/` |
| 7 | Set the Vite env `VITE_API_URL` to your backend Railway URL |

**Backend env vars to set in Railway:**
```
DATABASE_URL=        # Auto-provided by Railway PostgreSQL
JWT_SECRET=          # Generate: openssl rand -hex 32
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=https://your-frontend.railway.app
ENABLE_AI_SCORING=false
```

**Backend build/start commands:**
```
Build: npx prisma generate && npx prisma migrate deploy && npm run build
Start: node dist/index.js
```

---

### Option B: Split Deploy (Vercel + Railway)

**Frontend on Vercel (free), Backend + DB on Railway.**

#### Frontend (Vercel)
| Step | Action |
|------|--------|
| 1 | Go to vercel.com → Import GitHub repo |
| 2 | Set **Root Directory** to `./` (the frontend root) |
| 3 | Framework: Vite, Build command: `npm run build`, Output: `dist` |
| 4 | Add env var: `VITE_API_URL=https://your-backend.railway.app` |
| 5 | Deploy |

> **WARNING:** When splitting frontend/backend, you need to update `src/lib/api.ts` to use `VITE_API_URL` instead of the relative `/api` path. See "Code Changes Required" below.

#### Backend (Railway)
Same as Option A steps 2-5.

---

### Option C: Free Tier Stack (Vercel + Render + Neon)

**$0/month** — good for demos, sleeps after inactivity.

| Component | Service | Free Tier |
|-----------|---------|-----------|
| Frontend | Vercel | Unlimited static deploys |
| Backend | Render | 750 hrs/month (sleeps after 15min idle) |
| Database | Neon | 0.5GB, always-on |

#### Database (Neon)
1. Go to neon.tech → Create project "liquifi"
2. Copy the connection string → this is your `DATABASE_URL`

#### Backend (Render)
1. Go to render.com → New Web Service → Connect GitHub
2. **Root Directory:** `server`
3. **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
4. **Start Command:** `npx tsx src/index.ts`
5. Add env vars (DATABASE_URL from Neon, JWT_SECRET, etc.)

#### Frontend (Vercel)
Same as Option B frontend steps.

---

## Code Changes Required for Split Deploy

If frontend and backend are on different domains, update `src/lib/api.ts`:

```diff
- const API_BASE = '/api';
+ const API_BASE = import.meta.env.VITE_API_URL || '/api';
```

And update `server/src/index.ts` CORS to allow your frontend domain.

---

## Post-Deploy Checklist

| Task | Command/Action |
|------|---------------|
| Run migrations | `npx prisma migrate deploy` (auto in build step) |
| Seed database | `npx tsx src/utils/seed.ts` (run once via Railway shell or Render shell) |
| Test health | `curl https://your-backend-url/api/health` |
| Test frontend | Visit your Vercel/Railway URL |
| Set custom domain | Configure in hosting dashboard + DNS |

---

## Quick Decision Matrix

| Priority | Choose |
|----------|--------|
| Simplest setup | **Railway** (Option A) |
| Best free tier | **Vercel + Render + Neon** (Option C) |
| Best performance | **Vercel + Railway** (Option B) |
| Production-ready | **Vercel + Railway + Supabase** |
