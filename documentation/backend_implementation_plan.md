# LiqUIFI Backend Implementation Plan (v2)

## 0. Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node.js** | v20+ LTS |
| **PostgreSQL** | v15+ running locally (or Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=liquifi postgres:15`) |
| **Package Manager** | npm |

### Environment Variables (`.env`)

```env
DATABASE_URL="postgresql://postgres:liquifi@localhost:5432/liquifi?schema=public"
JWT_SECRET="your-256-bit-secret"
JWT_EXPIRES_IN="7d"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
# Feature flags
ENABLE_AI_SCORING=false          # false = use mock, true = call Gemini
GEMINI_API_KEY=""                 # Required only when ENABLE_AI_SCORING=true
GEOCODING_PROVIDER="nominatim"   # nominatim (free) | google
GOOGLE_MAPS_API_KEY=""           # Required only when GEOCODING_PROVIDER=google
```

Validated at startup with `zod` schema — server refuses to boot on missing required vars.

---

## 1. Current State & Data Inventory

> Same hardcoded data inventory and interactive hooks tables as v1 — unchanged. See [v1 Section 1].

**Additional frontend hooks identified in review:**
| UI Element | Location | Required Backend Action |
|------------|----------|----------------------|
| "Export Report" buttons | Portfolio cards | `POST /api/properties/:id/export` |
| "Update Appraisal" button | PropertyDetail | `POST /api/properties/:id/appraise` |
| Notifications bell | TopBar | `GET /api/notifications` |
| Logout button | Sidebar | `POST /api/auth/logout` |

---

## 2. Architecture

```
┌─────────────┐     ┌──────────────────────────────┐     ┌────────────┐
│  React SPA  │────▸│  Express REST API             │────▸│ PostgreSQL │
│  (Vite)     │     │  + Zod validation             │     │  + Prisma  │
│  port 5173  │     │  + Rate limiting (express-rate)│     │            │
│             │     │  + JWT auth middleware         │     │            │
│  src/lib/   │     │  port 3001                    │     │            │
│  api.ts     │     └──────┬───────────────────────┘     └────────────┘
└─────────────┘            │
                    ┌──────┴───────┐
                    │   Services   │
                    ├──────────────┤
                    │ • Auth (JWT) │
                    │ • AI Scoring │  ◀── Feature-flagged (mock default)
                    │ • Geocoding  │  ◀── Cached in DB
                    │ • PDF Export │
                    └──────────────┘
```

### Standard API Response Envelope

```ts
// Success
{ "success": true, "data": T }

// Paginated (offset-based)
{ "success": true, "data": T[], "pagination": { "page": 1, "pageSize": 20, "total": 174, "totalPages": 9 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details?": [] } }
```

### Middleware Stack
1. **CORS** — origin: `process.env.CORS_ORIGIN`, methods: `GET,POST,PATCH,DELETE`, credentials: `true`
2. **Rate limiter** — `express-rate-limit`, 100 req/min general, 10 req/min for auth
3. **Body parser** — `express.json({ limit: '10mb' })`
4. **Auth middleware** — JWT verification on protected routes
5. **Zod validation** — Request body/query/params validated per-route

---

## 3. Data Model (Prisma Schema)

```prisma
enum UserRole {
  ANALYST
  AUDITOR
  ADMIN
}

enum PropertyType {
  COMMERCIAL
  RESIDENTIAL
  INDUSTRIAL
  MIXED_USE
}

enum PropertyStatus {
  ACTIVE
  UNDER_REVIEW
  RISK_DETECTED
}

enum RiskStatus {
  LOW_RISK
  MEDIUM_RISK
  HIGH_RISK
}

enum AlertType {
  LIQUIDITY_DROP
  VACANCY_RISK
  SEVERE_OUTFLOW
  THRESHOLD_BREACH
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String
  role          UserRole       @default(ANALYST)
  password      String
  createdAt     DateTime       @default(now())
  properties    Property[]
  scoreRequests ScoreRequest[]

  @@index([email])
}

model Property {
  id              String         @id @default(cuid())
  name            String
  address         String
  city            String
  state           String
  country         String
  postalCode      String?
  lat             Float
  lng             Float
  propertyType    PropertyType
  status          PropertyStatus @default(ACTIVE)
  marketValue     Float
  liquidityScore  Float?
  capRate         Float?
  occupancyRate   Float?
  timeToLiquidity Int?
  yoyChange       Float?
  imageUrl        String?
  smeName         String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  userId          String
  user            User           @relation(fields: [userId], references: [id])
  assessments     AiAssessment[] @relation("PropertyAssessments")
  scoreRequests   ScoreRequest[] @relation("PropertyScoreRequests")
  riskAlerts      RiskAlert[]    @relation("PropertyRiskAlerts")

  @@index([userId])
  @@index([city])
  @@index([status])
  @@index([liquidityScore])
}

model ScoreRequest {
  id         String     @id @default(cuid())
  score      Float
  riskStatus RiskStatus
  createdAt  DateTime   @default(now())
  propertyId String
  property   Property   @relation("PropertyScoreRequests", fields: [propertyId], references: [id], onDelete: Cascade)
  userId     String
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([propertyId])
  @@index([createdAt])
}

model AiAssessment {
  id         String   @id @default(cuid())
  title      String
  detail     String
  sentiment  String   // positive | neutral | negative
  icon       String
  createdAt  DateTime @default(now())
  propertyId String
  property   Property @relation("PropertyAssessments", fields: [propertyId], references: [id], onDelete: Cascade)
}

model RiskAlert {
  id         String    @id @default(cuid())
  type       AlertType
  delta      Float
  resolved   Boolean   @default(false)
  createdAt  DateTime  @default(now())
  propertyId String
  property   Property  @relation("PropertyRiskAlerts", fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([resolved])
  @@index([propertyId])
}

model GeocodeCache {
  id        String   @id @default(cuid())
  query     String   @unique
  lat       Float
  lng       Float
  createdAt DateTime @default(now())

  @@index([query])
}
```

---

## 4. API Endpoints

### Auth
| Method | Route | Body/Params | Description |
|--------|-------|-------------|-------------|
| `POST` | `/api/auth/register` | `{ email, name, password, role? }` | Create account |
| `POST` | `/api/auth/login` | `{ email, password }` | Returns JWT |
| `POST` | `/api/auth/logout` | — | Invalidate token (client-side) |
| `GET`  | `/api/auth/me` | — | Current user profile |

### Dashboard
| Method | Route | Query | Description |
|--------|-------|-------|-------------|
| `GET` | `/api/dashboard/summary` | — | `{ liquidityScore, portfolioValue, avgTimeToSell, assetCount, deltas }` |
| `GET` | `/api/dashboard/recent-requests` | `?page=&pageSize=` | Paginated score requests |
| `POST` | `/api/dashboard/analyze` | `{ country, state, city, address }` | AI scoring pipeline |

### Properties
| Method | Route | Query/Body | Description |
|--------|-------|------------|-------------|
| `GET` | `/api/properties` | `?sort=liquidity|value&status=&region=&page=&pageSize=` | Filtered/sorted list |
| `POST` | `/api/properties` | `{ name, address, city, ... }` | Create + auto-geocode |
| `GET` | `/api/properties/:id` | — | Full detail + assessments |
| `PATCH` | `/api/properties/:id` | `{ partial fields }` | Update |
| `DELETE` | `/api/properties/:id` | — | Cascade delete with relations |
| `POST` | `/api/properties/:id/appraise` | — | Trigger AI re-appraisal |
| `POST` | `/api/properties/:id/export` | `{ format: "pdf"|"csv" }` | Generate report |

### Portfolio
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/portfolio/distribution` | `{ highLiquidity, underReview, riskWarning }` counts |

### Risk Analytics
| Method | Route | Query | Description |
|--------|-------|-------|-------------|
| `GET` | `/api/risk/metrics` | `?region=` | Health, exposure, reserve, uptime |
| `GET` | `/api/risk/high-risk-assets` | `?page=&pageSize=` | Flagged properties |
| `GET` | `/api/risk/hotspots` | `?region=` | `[{ lat, lng, riskLevel, name }]` |
| `POST` | `/api/risk/generate-report` | `{ region? }` | Audit PDF |

### Alerts & Notifications
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/alerts` | Unresolved alerts |
| `PATCH` | `/api/alerts/:id/resolve` | Mark resolved |
| `GET` | `/api/notifications` | User notifications (alert summaries, system events) |

### Reference Data
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/ref/countries` | Country list |
| `GET` | `/api/ref/states?country=` | State/province list |
| `GET` | `/api/ref/cities?state=` | City list |

### Search
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/search?q=` | PostgreSQL `ILIKE` across name, address, city, smeName |

---

## 5. Implementation Phases

### Phase 1: Foundation (~3 hours, includes testing setup)
- Init `server/` with Express + TypeScript + `tsx` dev runner
- Install: `prisma`, `zod`, `bcryptjs`, `jsonwebtoken`, `cors`, `express-rate-limit`
- Define Prisma schema, run `prisma migrate dev`
- **Seed 174 properties** matching frontend numbers (142 active, 28 review, 4 risk)
- Configure `.env` validation with Zod
- Set up Jest + Supertest for integration tests
- Write smoke test: health endpoint returns 200

### Phase 2: Core CRUD + API Client (~3 hours)
- Implement Properties CRUD (GET list, GET detail, POST, PATCH, DELETE)
- Implement Dashboard summary + recent-requests aggregation
- Implement Portfolio distribution counts
- **Create `src/lib/api.ts`** — centralized fetch wrapper with auth headers, error handling, typed responses
- Wire Dashboard, Portfolio pages to API via `api.ts`
- Tests: CRUD operations, aggregation correctness

### Phase 3: Authentication (~2 hours)
- Implement register/login/logout/me
- JWT middleware on all `/api/*` except auth routes
- Add Login + Register pages to frontend
- Wire Sidebar logout + TopBar user avatar
- Tests: auth flow, protected route rejection

### Phase 4: Risk & Analytics (~2 hours)
- Risk metrics computation (aggregated from Property + RiskAlert)
- Alerts CRUD with resolve
- High Risk Assets filtered query
- Notifications endpoint
- Wire RiskAnalytics page + TopBar notifications bell
- Tests: metric calculations, alert resolution

### Phase 5: AI & Intelligence Layer (~3 hours)
- **Mock AI scorer** (deterministic formula based on location + market value + occupancy) as default
- Feature-flagged Gemini API integration for real scoring
- AI Assessment generation (mock: template-based, real: LLM)
- Geocoding service with **GeocodeCache** table (check cache → call API → store)
- Wire "Run Predictive Analysis" + "Update Appraisal" buttons
- Tests: mock scorer output, cache hit/miss

### Phase 6: Export & Search (~2 hours)
- PDF export with `pdfkit` (property report + portfolio audit)
- CSV export for property lists
- Full-text search via PostgreSQL `ILIKE` (upgrade to `tsvector` if needed)
- Wire TopBar search, Export Report buttons
- Tests: PDF generation, search relevance

**Total estimated: ~15 hours** (vs ~10 in v1, now includes testing + realistic complexity)

---

## 6. Frontend Integration Map

| Frontend File | Change | API Call |
|---------------|--------|----------|
| **NEW** `src/lib/api.ts` | Centralized API client (fetch wrapper, auth, types) | — |
| **NEW** `src/pages/Login.tsx` | Login page | `POST /api/auth/login` |
| `App.tsx` | Add `/login`, `/register` routes + auth context | — |
| `Dashboard.tsx` | Replace 3 metric cards | `GET /api/dashboard/summary` |
| `Dashboard.tsx` | Replace table | `GET /api/dashboard/recent-requests` |
| `Dashboard.tsx` | Wire "Run Predictive Analysis" | `POST /api/dashboard/analyze` |
| `Dashboard.tsx` | Wire location dropdowns | `GET /api/ref/countries,states,cities` |
| `Portfolio.tsx` | Replace sidebar stats | `GET /api/portfolio/distribution` |
| `Portfolio.tsx` | Replace property cards | `GET /api/properties?sort=&page=` |
| `Portfolio.tsx` | Wire "Export Report" | `POST /api/properties/:id/export` |
| `RiskAnalytics.tsx` | Replace 4 metrics | `GET /api/risk/metrics` |
| `RiskAnalytics.tsx` | Replace table | `GET /api/risk/high-risk-assets` |
| `PropertyDetail.tsx` | Replace all data | `GET /api/properties/:id` |
| `PropertyDetail.tsx` | Wire "Update Appraisal" | `POST /api/properties/:id/appraise` |
| `PropertyDetail.tsx` | Wire "Export Report" | `POST /api/properties/:id/export` |
| `TopBar.tsx` | Wire search | `GET /api/search?q=` |
| `TopBar.tsx` | Wire notifications bell | `GET /api/notifications` |
| `Sidebar.tsx` | Wire logout | `POST /api/auth/logout` |

---

## 7. Directory Structure

```
liquifi/
├── src/                          # Frontend
│   ├── lib/
│   │   └── api.ts                # [NEW] Centralized API client
│   ├── components/
│   ├── pages/
│   │   ├── Login.tsx             # [NEW]
│   │   └── ...existing
│   └── ...
├── server/
│   ├── src/
│   │   ├── index.ts              # Express entry + middleware stack
│   │   ├── config.ts             # Env validation (Zod)
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── properties.ts
│   │   │   ├── portfolio.ts
│   │   │   ├── risk.ts
│   │   │   ├── alerts.ts
│   │   │   ├── notifications.ts
│   │   │   ├── search.ts
│   │   │   └── reference.ts
│   │   ├── services/
│   │   │   ├── aiScoring.ts      # Mock default + Gemini feature flag
│   │   │   ├── geocoding.ts      # Cached via GeocodeCache table
│   │   │   └── pdfExport.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validate.ts       # Zod middleware
│   │   │   └── rateLimiter.ts
│   │   └── utils/
│   │       └── seed.ts           # Seeds 174 properties
│   ├── prisma/
│   │   └── schema.prisma
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── properties.test.ts
│   │   └── risk.test.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── package.json
└── vite.config.ts
```
