# Deployment & Operations

This document describes how to deploy, operate, and monitor Cabbie across staging and production environments.

## 1. Environments

| Environment | Purpose | Notes |
| --- | --- | --- |
| Local | Developer laptops, feature work. | SQLite by default. Redis optional. |
| Staging | QA/regression environment. | Mirror production topology (MySQL/Postgres + Redis). Enable GA4 sandbox keys. |
| Production | Customer-facing site. | Hardened secrets, HTTPS, WAF/CDN recommended. |

## 2. Build & Release Pipeline

1. **Install dependencies:** `npm ci` (use npm 10+).
2. **Generate Prisma client:** `npm run prisma:generate`.
3. **Run tests:** `npm run test` + `npm run test:pw` (E2E requires baseURL to point at staging server or Playwright service).
4. **Build:** `npm run build` (transpiles TS, runs `tsc`, builds Next.js output, generates sitemaps).
5. **Deploy artifacts:** copy `.next/`, `public/`, `package.json`, `node_modules` (production) or run `npm install --omit=dev` on the target host.
6. **Start server:** `npm run start` (Next.js) or use a process manager (PM2, systemd, Docker).

### PM2 Example

`ecosystem.config.js` includes a sample app definition. Update `cwd` and environment variables before using:
```bash
pm2 start ecosystem.config.js --env production
```

### Docker Example

A simple Dockerfile is provided. Build and run:
```bash
docker build -t cabbie .
docker run -d --env-file .env -p 3000:3000 cabbie
```

For multi-service setups use `docker-compose.yml` (Next.js + MySQL + Redis). Adjust `DATABASE_URL` accordingly.

## 3. Configuration Checklist

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Set to `production` in prod/staging. Controls OTP logging and analytics behavior. |
| `PORT` | HTTP port for Next.js (default 3000). |
| `DATABASE_URL` | Point to managed MySQL/Postgres. Use connection pooling or Prisma Data Proxy for serverless deployments. |
| `BRAND_NAME` / `SITE_DOMAIN` | Used for SEO metadata and canonical URLs. |
| `GA4_MEASUREMENT_ID` / `GA4_API_SECRET` | Enables server-side analytics (`lib/analytics/mp.ts`). |
| `NEXT_PUBLIC_GA4_ID` | Client-side GA instrumentation if required. |
| `REDIS_URL` | Required in production for OTP, rate limiting, idempotency. |
| `ADMIN_JWT_SECRET` | Random 32+ char string for admin session signing. |
| `BOOKING_HASH_SALT` | Salt for booking hash used in analytics. |
| `GOOGLE_PLACES_API_KEY` / `GOOGLE_MAPS_API_KEY` | Provide real distance and autocomplete. Configure billing in Google Cloud. |
| `ENABLE_HI_LOCALE` | Set to `1` to enable Hindi translations in SEO pages. |

Store secrets in your secret manager (AWS SSM, GCP Secret Manager, Vault) and inject via environment variables.

## 4. Database Operations

- **Migrations:** `npm run db:migrate:deploy` (runs compiled migrations in production). Use `npx prisma migrate deploy --schema prisma/schema.prisma` if running outside npm scripts.
- **Seeds:** Avoid running `npm run db:seed` automatically in production unless you intend to upsert marketing content. Prefer targeted scripts.
- **Backups:** Schedule daily dumps (e.g., `mysqldump --single-transaction`). Store backups off-site.
- **Monitoring:** Track connection counts, slow queries, and disk usage. Prisma logs can be enabled via `LOG_LEVEL=debug` or `PRISMA_LOG_LEVEL`.

## 5. Cache & Session Stores

- Redis handles OTP (`lib/otp2.ts`), OTP sessions (`lib/otpSession.ts`), rate limiting (`lib/limiter.ts`), and idempotency (`lib/idempotency.ts`).
- Use a managed Redis service with persistence (e.g., AWS Elasticache, Upstash) and TLS.
- Monitor TTL expirations; OTP codes default to 5 minutes, sessions to 10 minutes.

## 6. Logging & Monitoring

| Area | Tooling | Notes |
| --- | --- | --- |
| Application logs | stdout / structured logs | Use a log shipper (Fluent Bit, CloudWatch) to ingest Next.js logs. Correlation IDs appear in API responses. |
| Analytics | GA4 Measurement Protocol | Configure GA4 to capture server-side `booking_created` events. |
| RUM | `/api/v1/rum` JSONL | Rotate or export `data/rum/*.jsonl`. Consider piping to BigQuery or S3 via cron. |
| Performance budgets | `budgets.json` + `npm run check:budgets` | Guard bundle sizes and LCP/CLS budgets. |
| Accessibility | `npm run axe:contrast`, `npm run test:a11y:axe` | Include in CI to prevent regressions. |

## 7. Security Hardening

- Serve behind HTTPS. Terminate TLS at a load balancer or reverse proxy.
- Add rate limiting at the edge (e.g., Cloudflare, AWS WAF) for `/api/otp/*` and `/api/admin/login`.
- Rotate `ADMIN_JWT_SECRET` and `BOOKING_HASH_SALT` periodically.
- Use HTTP security headers (configure reverse proxy) and enable `SameSite=Lax` cookies (already set).
- Regularly update dependencies (`npm outdated`, `npm audit`).

## 8. Observability Runbook

| Symptom | Checks | Remediation |
| --- | --- | --- |
| Elevated OTP failures | Inspect Redis connectivity, ensure clock sync, review `/api/otp/send` rate limits. | Restart Redis if down; scale horizontally if hitting memory limits. |
| Bookings failing with 409 | Indicates fare mismatch; confirm `/api/quotes` caching, reseed fares, or adjust tolerance (`TOLERANCE = 50`). |
| Slow search results | Check Google API quotas. Fallback distances may be slower due to large datasets—consider caching frequent routes. |
| Admin login loops | Verify cookies allowed in browser, ensure `ADMIN_JWT_SECRET` consistent across replicas. |

## 9. CI/CD Suggestions

- Lint + test on every PR (`npm run test`, `npx eslint .`).
- Optional: run Playwright against preview deployments.
- Automate `npm run build` and publish artifacts to a registry or storage bucket.
- Tag releases with semantic versions; include migration instructions in release notes.

## 10. Disaster Recovery

- Maintain backup of `.env` or secrets in secure vault.
- Document restore procedures: deploy infrastructure, restore database from latest dump, restore Redis snapshot if available.
- Validate restored environment by running health checks and sample booking flow (see [USAGE.md](USAGE.md)).

Keep this document synchronized with actual operations practices. Update when infrastructure changes (e.g., new CI provider, observability tooling).
