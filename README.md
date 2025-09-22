# Cabbie Developer Handbook

Cabbie is an intercity cab booking platform built with Next.js. It combines marketing pages, dynamic search, OTP-based booking confirmation, and an admin dashboard for managing routes and fares. This repository contains everything needed to run the product locally, deploy it to staging/production, and extend it safely.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Snapshot](#architecture-snapshot)
4. [Getting Started](#getting-started)
5. [Development Workflow](#development-workflow)
6. [Core Workflows](#core-workflows)
7. [Testing & Quality](#testing--quality)
8. [Deployment Quick Start](#deployment-quick-start)
9. [Documentation Index](#documentation-index)
10. [Support](#support)

## Project Overview

- **Purpose:** Provide transparent, all-inclusive fares for intercity rides (focus on Raipur and neighbouring cities) with OTP-backed booking confirmation and analytics instrumentation.
- **Scope:** Public marketing pages, search results, fare pages, booking flow, admin routes for data management, and programmatic SEO content.
- **Key Features:**
  - Dynamic pricing via `/api/quotes` and `/api/bookings` (server-side recomputation & discount validation).
  - OTP send/verify endpoints with Redis-backed rate limiting and session tokens.
  - Search results experience under the Next.js App Router (`/search-results`).
  - Programmatic SEO (route highlights/FAQs from `ContentToken`).
  - Admin authentication with JWT cookies and CSRF support.
  - Analytics integrations (GA4 Measurement Protocol + RUM endpoint).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (Pages + App Router), React 18 |
| Language | TypeScript (with emitted `.js` for Node compatibility) |
| Data | Prisma ORM, SQLite (dev), MySQL/Postgres (prod-ready), Redis (OTP/idempotency) |
| Styling | CSS custom properties (`styles/theme.css`), Tailwind-compatible utility classes |
| Testing | Jest (`tests/`), Playwright (`tests/e2e`), axe & Lighthouse scripts |
| Tooling | Docker Compose (optional), PM2 example config, Makefile helpers |

## Architecture Snapshot

- Hybrid routing: legacy marketing & API routes live in `pages/`; new experiences use `app/`.
- API requests pass through `lib/apiWrapper.ts` (correlation IDs, structured errors).
- Pricing logic lives in `lib/pricing.ts` and `lib/quotes.ts`, backed by Prisma models (`City`, `Route`, `Fare`, `Offer`, `Booking`, `Driver`, `Assignment`, `ContentToken`, `User`).
- OTP pipeline: `/api/otp/send` → `/api/otp/verify` → `/api/bookings` with Redis/memory-backed session tokens.
- Analytics: `lib/analytics/mp.ts` emits GA4 events; `/api/v1/rum` appends JSONL under `data/rum/`.
- See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for diagrams and detailed flow descriptions.

## Getting Started

> Complete instructions live in [docs/SETUP.md](docs/SETUP.md). Use the summary below for quick reference.

```bash
git clone <repo-url>
cd Cabbie
nvm use 20        # or install Node 20 manually
npm install
cp .env.example .env
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

- Optional: configure Google Maps Platform (Maps JavaScript API + Places + Routes). Copy `.env.sample` → `.env` and set:
  - `MAPS_ENABLED=true`
  - `GOOGLE_MAPS_BROWSER_KEY=<restricted browser key>`
  - `GOOGLE_MAPS_SERVER_KEY=<restricted server key>`
  - `MAPS_REGION=IN`, `MAPS_LANGUAGE=en` (override for other locales)
  - Keep `MAPS_ENABLED=false` to remain on the legacy, fully offline experience.

- Visit http://localhost:3000/test → `it works ✅`.
- API health: `curl http://localhost:3000/api/health` → `{ "ok": true }`.
- Run `npm run dev:doctor` if setup fails (checks Docker, ports, env vars, Prisma).

## Development Workflow

| Task | Command(s) |
| --- | --- |
| Start dev server | `npm run dev` (default port 3000) |
| Build production bundle | `npm run build` → `npm run start` |
| Generate static preview | `npm run export` (outputs `out-offline/`) |
| Reset database | `npm run db:reset` |
| Prisma Studio GUI | `npm run db:studio` |
| Clear OTP/idempotency (dev) | Restart dev server or flush Redis (`redis-cli FLUSHALL`) |

Use TypeScript `.ts`/`.tsx` files for new code. Legacy `.js/.jsx` files exist for backwards compatibility but should not receive new features unless explicitly required.

## Core Workflows

### Booking Flow

1. Landing page widget posts to `/api/quotes` for fare computation.
2. Customer requests OTP via `/api/otp/send` (rate limited, returns `mock_otp` in dev).
3. `/api/otp/verify` issues a session token (TTL 10 min) bound to the phone number.
4. Booking submission hits `/api/bookings` with the token + idempotency key. Server recomputes fare, applies discounts, enforces ±₹50 tolerance, persists booking, and emits analytics.
5. UI redirects to `/booking/confirmation` with status + fare details.

### Search Results

- Visit `/search-results?origin=Raipur&destination=Bilaspur&pickup_datetime=<ISO>`.
- Server validates query params (`app/search-results/page.tsx`) and renders `<SearchResults />`.
- Client hook fetches `/api/search-results`, which enriches mock cab options using `/api/distance/matrix` (Google API if keys exist, curated fallback otherwise).
- Selecting a cab caches details (`lib/booking-utils.ts`) for the booking form.
- Booking widget upgrades:
  - Google Maps JS + Places Autocomplete enhances pickup/drop fields when `MAPS_ENABLED=true` (restricted keys required).
  - `/api/resolve-place` resolves place IDs to coordinates, `/api/eta` uses Google Routes when available, otherwise falls back to curated estimates and Haversine heuristics.
  - All flows remain backward compatible when Maps is disabled or unavailable.

### Admin Portal

- Login: `/admin/login` (seeded credentials `admin@example.com` / `admin123`).
- `/api/admin/login` sets `admin_session` JWT cookie + CSRF token (see `lib/adminAuth.ts`).
- Middleware (`middleware.ts`) requires the cookie for `/admin/*`; API routes validate JWTs.

More walkthroughs live in [docs/USAGE.md](docs/USAGE.md).

## Testing & Quality

| Check | Command |
| --- | --- |
| Unit/integration tests | `npm run test` |
| Playwright E2E | `npm run test:pw` (start dev server first) |
| Accessibility | `npm run axe:contrast`, `npm run test:a11y:axe` |
| Performance budgets | `npm run check:budgets` |
| Lint (manual) | `npx eslint . --ext .ts,.tsx` |

**CI expectation:** All applicable commands pass before submitting a PR. Provide output in the PR description.

## Deployment Quick Start

1. Ensure secrets (`DATABASE_URL`, `REDIS_URL`, `ADMIN_JWT_SECRET`, GA/Google keys) are in the environment or secret manager.
2. On the server:
   ```bash
   npm ci
   npm run prisma:generate
   npm run db:migrate:deploy
   npm run build
   npm run start
   ```
3. Optional: use Docker (`docker build -t cabbie . && docker run -d --env-file .env -p 3000:3000 cabbie`) or PM2 (`pm2 start ecosystem.config.js --env production`).
4. Monitor health via `/api/v1/health` (`db` + `cache` status) and `/api/v1/rum` JSONL files.

Refer to [docs/OPERATIONS.md](docs/OPERATIONS.md) for CI/CD, logging, and disaster recovery guidance.

## Documentation Index

- [docs/README.md](docs/README.md) — Master index of all documentation.
- Highlights:
  - [SETUP.md](docs/SETUP.md) — Environment setup (Node, Docker, migrations).
  - [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Detailed system diagrams and module breakdown.
  - [API.md](docs/API.md) — Endpoint contracts, rate limits, error envelopes.
  - [DATABASE.md](docs/DATABASE.md) — Prisma schema, seed data, migrations.
  - [STYLEGUIDE.md](docs/STYLEGUIDE.md) — Design tokens, component conventions, accessibility.
  - [OPERATIONS.md](docs/OPERATIONS.md) — Deployment, secrets, monitoring.
  - [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — Symptom-based fixes.
  - [FAQ.md](docs/FAQ.md) — Quick answers & limitations.
  - [docs/archive/](docs/archive/) — Historical docs retained for reference.
- Contribution standards live in [CONTRIBUTING.md](CONTRIBUTING.md).

## Support

- Run through [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) before escalating.
- Collect logs (`npm run dev:doctor`, console output, relevant requests) when reporting issues.
- For new questions or proposals, open a discussion/issue and reference the relevant documentation section.

Happy shipping! Keeping code, data, and docs synchronized ensures fast onboarding for both human teammates and AI collaborators.
