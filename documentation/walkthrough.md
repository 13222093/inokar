# LiqUIFI Backend Implementation Walkthrough

## What Was Built

A complete Express + TypeScript + Prisma backend API for the LiqUIFI Dashboard, with a frontend API client featuring mock data fallbacks for MVP use.

## Server Architecture

```
server/
├── prisma/schema.prisma       # 6 models, 5 enums, indexes, cascade deletes
├── src/
│   ├── index.ts                # Express entry (CORS, rate-limit, health check)
│   ├── config.ts               # Zod-validated .env
│   ├── middleware/auth.ts       # JWT verification
│   ├── routes/
│   │   ├── auth.ts             # Register, Login, Logout, Me
│   │   ├── dashboard.ts        # Summary aggregation, recent requests
│   │   ├── properties.ts       # Full CRUD with filter/sort/paginate
│   │   ├── portfolio.ts        # Distribution counts
│   │   ├── risk.ts             # Metrics, high-risk assets, hotspots
│   │   ├── alerts.ts           # List + resolve
│   │   └── search.ts           # ILIKE full-text search
│   └── utils/
│       ├── prisma.ts           # Singleton client
│       └── seed.ts             # 174 properties, 2 users, alerts, assessments
└── .env                        # Dev defaults
```

## Frontend Integration

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Centralized API client with JWT auth, typed endpoints, and mock data fallbacks |
| `vite.config.ts` | Proxy `/api` → `localhost:3001` for seamless dev |

The `api.ts` client follows the pattern: **try API → catch → return mock data.** This means the frontend works identically whether the backend is running or not.

## Data Model

- **User** — email, name, role (ANALYST/AUDITOR/ADMIN), hashed password
- **Property** — 20+ fields including location, financial metrics, AI scores
- **ScoreRequest** — Audit trail of liquidity score computations
- **AiAssessment** — AI-generated property analysis bullets
- **RiskAlert** — Typed alerts (LIQUIDITY_DROP, VACANCY_RISK, etc.)
- **GeocodeCache** — Avoids redundant external geocoding calls

## Verification

| Check | Result |
|-------|--------|
| Server `tsc --noEmit` | ✅ Zero errors |
| Frontend `npm run build` | ✅ Zero errors, built in 1.83s |
| Prisma client generation | ✅ Generated successfully |

## How to Run

```bash
# Terminal 1: Start backend (requires PostgreSQL)
cd server
npx prisma migrate dev --name init
npm run db:seed
npm run dev

# Terminal 2: Start frontend
cd liquifi
npm run dev
```

Demo credentials: `analyst@liquifi.io` / `demo1234`
