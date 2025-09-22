# Troubleshooting Guide

Use this guide when local development, CI, or deployed environments misbehave. Each section lists symptoms, diagnostic commands, and fixes.

## 1. Quick Flow

1. Confirm Node 20 is active: `node -v` → `v20.x`.
2. Run `npm run dev:doctor` for automated diagnostics (Docker, ports, Prisma, env vars).
3. If the issue persists, locate the relevant section below.

## 2. Port & Server Issues

| Symptom | Checks | Fix |
| --- | --- | --- |
| `curl localhost:3000` fails / browser cannot connect | `lsof -i :3000`, `npm run dev` output | Ensure dev server is running. Kill conflicting processes (`kill $(lsof -ti:3000)`). Verify no firewall rules block localhost. |
| Docker `app` container restarting | `docker compose ps`, `docker compose logs app` | Rebuild (`docker compose up --build`), confirm `.env` is mounted, and that `npm install` succeeded inside the container. |
| Next.js ready message never appears | Inspect terminal output for TypeScript errors. | Fix compile errors surfaced by `tsc` or `eslint`. |

## 3. Environment Variables

| Symptom | Checks | Fix |
| --- | --- | --- |
| `DATABASE_URL` undefined | `cat .env`, `env | grep DATABASE_URL` | Copy `.env.example` to `.env`. For Docker, ensure `env_file: .env` is present. |
| Client-side env missing | `console.log(process.env.NEXT_PUBLIC_*)` in browser devtools | Prefix new client variables with `NEXT_PUBLIC_`. Restart dev server after editing `.env`. |
| OTP mock not returned | Verify `NODE_ENV` | Mock OTPs are only included when `NODE_ENV !== 'production'`. |

## 4. Database & Prisma

| Symptom | Checks | Fix |
| --- | --- | --- |
| `PrismaClientInitializationError` (SQLite) | `ls cabdb.sqlite`, `npm run db:migrate` | Ensure migrations ran. Delete `cabdb.sqlite` and run `npm run db:reset` to rebuild. |
| MySQL connection refused (Docker) | `docker compose ps db`, `docker logs cab_db` | Wait for MySQL healthcheck to pass. Update `DATABASE_URL` to `mysql://root:root@localhost:3306/cabdb`. |
| Stale Prisma schema | `npm run prisma:generate` warnings | Regenerate Prisma client and restart dev server. |

## 5. OTP & Redis

| Symptom | Checks | Fix |
| --- | --- | --- |
| `/api/otp/send` returns 429 | Review server logs for `Too many OTP requests`. | Wait for window to reset (3 requests/15 min per phone, 10/hour per IP). For tests, change phone number or clear Redis keys (`DEL otp_phone_*`). |
| `/api/otp/verify` returns `UNAUTHORIZED` | Ensure OTP correct, check Redis TTL. | Mock OTP appears in response body during development. Confirm phone matches OTP issuance. |
| OTP sessions invalid | Inspect Redis for `otpTok:*` keys. | Redis must be reachable. If `REDIS_URL` unset, tokens use in-memory map—restart dev server to clear. |

## 6. Booking API

| Symptom | Checks | Fix |
| --- | --- | --- |
| `409 Fare changed` | Compare payload vs `/api/quotes`. | Request a fresh quote before booking. Ensure client sends the recomputed `fare_quote_inr`. |
| `401 OTP token not valid` | Verify OTP phone matches `customer_phone`. | Re-run OTP verification for the same phone. Tokens are single-use. |
| Duplicate bookings | Review `Idempotency-Key` header. | Use a unique idempotency key per booking attempt. Replays with same key return cached response. |

## 7. Search & Distance APIs

| Symptom | Checks | Fix |
| --- | --- | --- |
| `/api/search-results` 500 | Inspect logs for distance API errors. | Configure `GOOGLE_MAPS_API_KEY` or rely on fallback dataset. Validate `origin`/`destination` query strings. |
| Distances unrealistic | Check fallback table in `pages/api/search-results.ts`. | Add/adjust entries in fallback matrix for specific city pairs. |

## 8. Admin Portal

| Symptom | Checks | Fix |
| --- | --- | --- |
| Redirect loop to `/admin/login` | Inspect cookies in browser devtools. | Ensure cookies are not blocked (disable `SameSite=None`). Confirm server domain matches cookie domain. |
| 401 after login | Server logs for JWT errors. | Set consistent `ADMIN_JWT_SECRET` across instances. Re-seed admin user if credentials unclear (`npm run db:seed`). |

## 9. Tests & Tooling

| Symptom | Checks | Fix |
| --- | --- | --- |
| Jest fails: cannot find module `@prisma/client` | Was `npm run prisma:generate` run? | Generate Prisma client before running tests. |
| Playwright cannot connect | Ensure dev server on port 3000. | `npm run dev` in one terminal, `npm run test:pw` in another. |
| Axe/Lighthouse scripts fail | Check Chrome install. | Install Chrome/Chromium locally or run in CI container with dependencies. |

## 10. Logs & Diagnostics

- **Server logs:** Next.js prints HTTP status and errors to stdout. Use `DEBUG=* npm run dev` for verbose logging.
- **RUM ingest:** Inspect `data/rum/*.jsonl` for structured metrics. Delete files to reset state.
- **Analytics events:** With `LOG_ANALYTICS=1 npm run dev`, server analytics events are echoed to console.

## 11. Getting Help

Collect the following before escalating:
- Output from `npm run dev:doctor`.
- Exact request payloads (sanitized) and response bodies.
- Relevant environment variables (omit secrets).
- Logs from `docker compose logs` or Next.js console.

Share these details in the issue tracker or support channel so maintainers can reproduce the problem quickly.
