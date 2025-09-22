# Architecture

Cabbie is a Next.js 14 application focused on intercity cab bookings. It combines static marketing pages with transactional booking APIs, a Prisma-backed database, and optional integrations with Redis and Google Maps.

## 1. System Overview

```
Browser (React/Next.js) ──▶ Next.js App Router & Pages Router ──▶ API Routes ──▶ Prisma ORM ──▶ SQLite/MySQL/Postgres
                                    │                                │
                                    │                                ├──▶ Redis (OTP, rate limiting, idempotency) [optional]
                                    │                                ├──▶ GA4 Measurement Protocol (analytics)
                                    │                                └──▶ Filesystem (`data/rum/*.jsonl` for RUM logs)
                                    └──▶ Static assets (`public/`, `styles/`)
```

Key decisions:

- **Hybrid routing** — Legacy marketing pages live under `pages/`, while new search experiences use the `app/` directory (`app/search-results`).
- **Prisma ORM** — Provides a single schema (`prisma/schema.prisma`) that works against SQLite for development but supports MySQL/Postgres for production.
- **Server-side pricing** — `/api/quotes` and `/api/bookings` recalculate fares server-side to avoid client tampering, enforcing idempotency via `Idempotency-Key` headers.
- **OTP security** — Codes are hashed (`lib/otp2.ts`), single-use, and exchanged for a booking session token stored in Redis or memory (`lib/otpSession.ts`).
- **Analytics** — The system can forward events to GA4 (`lib/analytics/mp.ts`) and accepts real user monitoring payloads via `/api/v1/rum`.

## 2. Directory Structure

| Path | Description |
| --- | --- |
| `app/` | App Router pages (currently search results) and shared layouts for experimental sections. |
| `pages/` | Classic Pages Router, including marketing pages, booking flows, and API routes under `pages/api/`. |
| `components/` | Reusable UI components (React + Tailwind-compatible utility classes). `.tsx` variants are canonical; `.jsx` are kept for legacy compatibility. |
| `hooks/` | Client-side hooks such as `use-search-results` for filtering/sorting search data. |
| `lib/` | Server and shared libraries: pricing, OTP, analytics, admin auth, validation, idempotency, SEO helpers. Each `.ts` file has a compiled `.js` sibling for Node runtimes without TypeScript support. |
| `prisma/` | Prisma schema, migrations, and `seed.js`. |
| `public/` | Static assets (logos, favicons, JSON-LD). |
| `scripts/` | Node/JS scripts for sitemaps, static export, data resets, SEO checks, performance snapshots. |
| `styles/` | Design system CSS tokens (`theme.css`), global overrides (`global.css`), and legacy stylesheets. |
| `tests/` | Jest unit/integration tests (`tests/`) and Playwright E2E (`tests/e2e`). |

## 3. Request Lifecycle

### 3.1 Booking API (`POST /api/bookings`)

1. Client sends booking payload with `Idempotency-Key` header and OTP session token.
2. `withApi` wrapper attaches a correlation ID and enforces consistent error handling.
3. `lib/idempotency.ts` checks Redis/memory for an existing response; if missing, executes the handler.
4. Handler consumes the OTP session (`lib/otpSession.ts`), recalculates pricing (`lib/pricing.ts` → `lib/quotes.ts` → Prisma route lookup), applies discount logic, and inserts a booking record.
5. `lib/analytics/mp.ts` emits a GA4 event (when secrets are configured) and returns a response via `jsonCreated`.

### 3.2 Quote API (`POST /api/quotes`)

- Validates with Zod (`lib/validate.ts`).
- Resolves `route_id` via Prisma and returns computed fares, discount metadata, and night surcharge flags.

### 3.3 OTP APIs

- `/api/otp/send` rate limits by phone + IP (`lib/limiter.ts`), issues hashed OTP codes (`lib/otp2.ts`), and returns TTL + `mock_otp` in development.
- `/api/otp/verify` ensures codes are unused, matches hashed values, and exchanges them for single-use booking session tokens stored by `lib/otpSession.ts`.

### 3.4 Search Results (`GET /search-results`)

- `app/search-results/page.tsx` uses server-side validation to guard parameters then renders the client component.
- The client hook hits `/api/search-results`, which enriches local cab option templates by calling `/api/distance/matrix`.
- Distance matrix uses Google APIs when `GOOGLE_MAPS_API_KEY` is present; otherwise it falls back to curated distance tables for Indian routes.

## 4. Data Flow

```
Landing Page → Quote Request → OTP Request → OTP Verify → Booking Submission → Confirmation
                     │              │             │                │
                     ▼              ▼             ▼                ▼
           /api/quotes        /api/otp/send   /api/otp/verify   /api/bookings
                     │              │             │                │
                     ▼              ▼             ▼                ▼
                Prisma (Route)  Redis/Memory   Redis/Memory     Prisma (Booking)
```

- **UTM attribution** — Booking API inspects cookies (`utm_first`) and copies the values into booking records.
- **Discounts** — Offers live in the `Offer` table. `lib/pricing.ts` calculates flat or percentage discounts with optional caps and validity windows.
- **Night surcharge** — Applied when pickup time is between 22:00–05:00 (20% uplift).

## 5. Data Storage

| Layer | Details |
| --- | --- |
| Database | Prisma models: `City`, `Route`, `Fare`, `Booking`, `Driver`, `Assignment`, `Offer`, `ContentToken`, `User`. SQLite by default, MySQL/Postgres supported. |
| Cache | Redis (if `REDIS_URL` present) powers OTP, idempotency, and rate limiting; fallback is in-process `Map`. |
| File system | `data/rum/*.jsonl` for RUM metrics, `public/sitemap.xml` generated during build, static HTML from `npm run export`. |

## 6. Error Handling & Logging

- `lib/errors.ts` standardizes error codes (`VALIDATION_FAILED`, `RATE_LIMITED`, etc.) and status codes.
- Responses include `correlation_id` to trace through logs.
- OTP and booking flows log to console when running in development mode (safe to share since they omit secrets).
- `scripts/dev-diagnose.sh` aggregates logs and environment checks for troubleshooting.

## 7. Analytics & SEO

- `components/HeadSeo` and `components/JsonLd` manage SEO meta tags and structured data.
- `lib/seo.ts` centralizes site base URL and canonical helpers.
- Programmatic SEO content (route highlights and FAQ) is stored in `ContentToken` records seeded by `prisma/seed.js`.
- Lighthouse and axe checks (`npm run test:a11y:axe`, `npm run axe:contrast`) are part of QA.

## 8. Background/Batch Jobs

There are no long-running background workers. Scheduled tasks are limited to scripts run during CI/CD or cron-like automation:

- `npm run sitemap` — Generate sitemap to `public/sitemap.xml`.
- `npm run analytics:debug` — Start dev server with verbose analytics logs.
- `npm run rum:alerts` — Example script to inspect RUM metrics.

## 9. Security Considerations

- Admin routes require JWT cookies issued by `/api/admin/login` and protected by middleware.
- OTP codes are hashed and single-use.
- Booking API enforces idempotency and rejects mismatched fares beyond ±₹50 tolerance.
- CSRF tokens for admin APIs come from `lib/adminAuth.ts`.
- CORS is disabled by default but can be enabled per route using `withApi(handler, { cors: true })` (only allows localhost origins in development).

## 10. Extensibility Tips

- Add new API routes under `pages/api/*`. Export handlers wrapped in `withApi` for consistent error envelopes.
- When introducing new models, update `prisma/schema.prisma`, generate a migration, and add seed data in `prisma/seed.js`.
- Reuse `lib/validate.ts` to define new Zod schemas for request validation.
- Keep React components in `.tsx` files and co-locate stories/tests if applicable.
- Document changes in `docs/` and update the index so the knowledge base stays discoverable.
