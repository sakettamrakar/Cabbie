# Usage & Workflows

This guide covers the most common tasks once your environment is ready: running the app, exercising core user journeys, and validating releases.

## 1. Run the Development Server

```bash
npm run dev
```

- Default port: **3000** (configure via `PORT` env var when needed).
- Hot reloading is enabled for files under `pages/`, `app/`, `components/`, and `lib/`.
- Terminal output confirms readiness (`✓ Ready in ...`).

### Health Checks

- Browser check: http://localhost:3000/test → renders `it works ✅`.
- API check: `curl http://localhost:3000/api/health` → `{ "ok": true }`.
- Full stack check (DB + Redis): `curl http://localhost:3000/api/v1/health`.

## 2. Build and Serve Production Assets

```bash
npm run build    # Type-checks, compiles, and generates sitemaps
npm run start    # Starts Next.js in production mode on port 3000
```

Additional tooling:

- `npm run export` — Generates a static bundle under `out-offline/` for visual QA without a Node server.
- `npm run static` — Creates `static-preview.html` with the latest brand metadata.

## 3. Database Utilities

| Command | Purpose |
| --- | --- |
| `npm run db:migrate` | Apply pending Prisma migrations. |
| `npm run db:seed` | Upsert cities, routes, fares, offers, drivers, sample booking, admin account. |
| `npm run db:reset` | Drop & recreate schema then reseed. |
| `npm run db:studio` | Launch Prisma Studio GUI at http://localhost:5555. |

## 4. Booking Flow Walkthrough

1. Navigate to `/` (landing page) and fill the booking widget with origin/destination, future pickup date/time, and car type.
2. On submit, the client posts to `/api/quotes` to fetch an accurate fare using `lib/pricing` (Prisma-backed + heuristic).
3. The customer enters their phone number to request an OTP via `/api/otp/send`.
4. `/api/otp/verify` returns a short-lived booking session token (`token`, TTL 600s) after validating the code.
5. The booking form posts to `/api/bookings` with the fare quote, OTP session token, and UTM metadata (if available).
6. The API recomputes the fare, applies discounts, enforces idempotency via `Idempotency-Key` header, and persists to Prisma.
7. Successful responses include `{ booking_id, status, fare_locked_inr, event_id }` which the UI surfaces on the confirmation screen `/booking/confirmation`.

Try it end-to-end using the seeded Raipur ⇄ Bilaspur route:

- Pickup: Today + 2 hours.
- Car type: `SEDAN`.
- Discount: `WELCOME100` (valid for fares ≥ ₹1000).
- OTP in development will be returned as `mock_otp` in the `/api/otp/send` response when `NODE_ENV !== 'production'`.

## 5. Search Results Flow

- Navigate to `/search-results?origin=Raipur&destination=Bilaspur&pickup_datetime=2025-05-20T12:00`.
- `app/search-results/page.tsx` validates query params server-side and renders `<SearchResults />`.
- The component relies on `hooks/use-search-results.ts` to fetch `/api/search-results` for dynamic pricing + filtering.
- `/api/search-results` enriches mock cab options by calling `/api/distance/matrix` which in turn uses Google Distance Matrix when API keys are configured, otherwise falls back to curated distance tables.
- Selecting a cab caches the quote in local storage (`lib/booking-utils.ts`) before redirecting to the booking form.

## 6. Admin Portal

- Login: http://localhost:3000/admin/login (use seeded `admin@example.com` / `admin123`).
- Authentication: `/api/admin/login` issues `admin_session` (HTTP-only cookie) and a CSRF token.
- Middleware (`middleware.ts`) guards `/admin/*` routes by checking for the cookie. API routes perform JWT validation using `lib/adminAuth`.
- Example protected API: `/api/admin/routes` (see `pages/api/admin` directory) for managing cities/routes/fare tables.

## 7. Testing

| Command | Description |
| --- | --- |
| `npm run test` | Runs Jest unit/integration tests in `tests/` (config in `jest.config.ts`). |
| `npm run test:watch` | Jest watch mode. |
| `npm run test:pw` | Playwright end-to-end tests under `tests/e2e`. Requires the dev server on port 3000. |
| `npm run axe:contrast` / `npm run test:a11y:axe` | Accessibility regression checks (Lighthouse + axe). |

Before opening a PR, execute at least `npm run test` and the relevant accessibility checks if you touched UI components.

## 8. Telemetry & Diagnostics

- RUM ingest endpoint (`/api/v1/rum`) appends JSONL files under `data/rum/`. Useful for manual analysis in development.
- Server analytics events are emitted to GA4 (when `GA4_API_SECRET` + `GA4_MEASUREMENT_ID` are configured) via `lib/analytics/mp.ts`.
- Use `npm run analytics:test` to run targeted analytics Jest suites.

## 9. Troubleshooting

Refer to [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) for a symptom → fix matrix covering port conflicts, env loading, Prisma errors, OTP issues, and Docker pitfalls.
