# FAQ & Known Limitations

## General

### What is the tech stack?
- Next.js 14 (hybrid Pages + App Router)
- React 18 with TypeScript-first source files
- Prisma ORM targeting SQLite/MySQL/Postgres
- Redis for OTP/idempotency (optional locally)
- Tailwind-compatible CSS variables (`styles/theme.css`)
- Jest + Playwright for testing

### Where is the single source of truth for documentation?
See [docs/README.md](README.md) for the index. Archived legacy docs live under `docs/archive/`.

## Development

### Which Node version is supported?
Node 20.x (`.nvmrc`). Use `nvm use` or Volta to pin the version.

### How do I reset my local database?
Run `npm run db:reset` (drops schema, reapplies migrations, reseeds). SQLite file lives at `cabdb.sqlite`.

### How do I run the app without Docker?
Install Node 20, run `npm install`, `npm run prisma:generate`, `npm run db:migrate`, `npm run db:seed`, then `npm run dev`.

### Do I need Redis locally?
No. When `REDIS_URL` is absent, OTP and idempotency fall back to in-memory storage. For integration tests that require Redis semantics, run the Redis container from `docker-compose.yml`.

## Booking & OTP

### Why does `/api/otp/send` throttle me after a few attempts?
The handler enforces rate limits (3/15 min per phone, 10/hour per IP). Change the phone number or wait for the window to reset when testing.

### Why do I receive `401 OTP token not valid`?
OTP session tokens are single-use and bound to the phone number used during verification. Re-run `/api/otp/verify` to get a fresh token.

### How do discounts work?
Offers are stored in the `Offer` table. `lib/pricing.ts` applies FLAT or PCT discounts, respects caps, and returns metadata in `/api/quotes`. Booking submission revalidates discounts before locking the fare.

## Search & Content

### Are distance calculations accurate without Google API keys?
The API falls back to curated distances covering Indian cities, especially Chhattisgarh. For production accuracy, set `GOOGLE_MAPS_API_KEY` and `GOOGLE_PLACES_API_KEY`.

### Where do SEO highlights/FAQs come from?
`ContentToken` rows seeded via `npm run db:seed`. Update them through Prisma or admin tooling to change copy.

## Admin & Security

### Default admin credentials?
`admin@example.com` / `admin123` after seeding. Override via `ADMIN_EMAIL` / `ADMIN_PASSWORD` before running `npm run db:seed`.

### How is authentication handled?
`/api/admin/login` signs a JWT (`admin_session`) stored as an HTTP-only cookie. Middleware ensures the cookie exists for `/admin/*`; API routes validate JWT signature using `ADMIN_JWT_SECRET`.

### Does the app support multi-language content?
`lib/i18n.ts` toggles Hindi copy when `ENABLE_HI_LOCALE=1`. Expand by adding new locale bundles and updating components to use the helpers.

## Deployment

### What commands do I run on the server?
```
npm ci
npm run prisma:generate
npm run db:migrate:deploy
npm run build
npm run start
```
Consider PM2/systemd for process management (see [OPERATIONS.md](OPERATIONS.md)).

### How do I configure environment variables securely?
Use your platform's secret manager (AWS SSM, GCP Secret Manager, Vault). Never commit `.env` files. Document required keys in onboarding docs.

## Testing

### How do I run Playwright tests?
Start the dev server (`npm run dev`) in one terminal and run `npm run test:pw` in another. Configure baseURL in `playwright.config.ts` if using a different port.

### Accessibility testing expectations?
Run `npm run axe:contrast` and `npm run test:a11y:axe` before merging UI changes. Address reported issues or document false positives in the PR.

## Known Limitations

- `/api/search-results` currently returns mock pricing enriched with distance calculations. Persisted search data is planned but not implemented.
- OTP fallback stores tokens in-memory when Redis is absent, so tokens reset on server restart (acceptable for development).
- App Router usage is limited to `/search-results`; most legacy pages still use the Pages Router.
- Static export (`npm run export`) omits API functionality. Use only for visual QA.

Have another question? Update this FAQ and link to the relevant documentation so future contributors benefit.
