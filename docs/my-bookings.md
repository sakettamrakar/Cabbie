# Manage My Bookings

## Overview
The Manage My Bookings experience lets customers authenticate with a one-time password (OTP) tied to their phone number and view bookings created with that number. Access is guarded by the `FEATURE_MY_BOOKINGS` flag.

* `/my-bookings` – OTP login form. On successful verification it issues the `mb_session` cookie (HTTP only, 24h TTL).
* `/my-bookings/list` – Server-rendered list of bookings for the authenticated phone number with pagination (20 per page). Includes logout and load-more actions.
* `/api/my-bookings` – Returns bookings for the active `mb_session`, supporting cursor pagination via `next_cursor`.
* `/api/my-bookings/logout` – Clears the `mb_session` cookie.

All pages respond with `<meta name="robots" content="noindex,nofollow">` and are omitted from sitemap generation.

## Session details
* Cookie name: `mb_session`
* Payload: JWT `{ phone, iat, exp }`
* TTL: configurable via `MB_SESSION_TTL_HOURS` (default 24h)
* Secret: `MB_SESSION_SECRET`
* Cookie attributes: `HttpOnly`, `SameSite=Lax`, `Secure` in production

## Environment flags
```
FEATURE_MY_BOOKINGS=true
NEXT_PUBLIC_FEATURE_MY_BOOKINGS=true
MB_SESSION_TTL_HOURS=24
MB_SESSION_SECRET=change-me
OTP_BYPASS=false
```

Enable `OTP_BYPASS=true` in local development or automated tests to accept any OTP value without contacting the SMS provider. The bypass is ignored in production (`NODE_ENV=production`).

## Local testing
1. Ensure Prisma is connected to Postgres (or SQLite for local dev) and run `npm run dev`.
2. In a separate shell, create a few bookings through the normal flow using the same phone number.
3. Visit `http://localhost:3000/my-bookings` and request an OTP. With `OTP_BYPASS=true`, any 4-digit code will work; otherwise use the mock code returned in the API response while in development.
4. After verification you are redirected to `/my-bookings/list` and should see your bookings.
5. Use the “Load more” button to paginate (if more than 20 bookings exist). Use “Log out” to clear the session and return to the login page.
6. Restart the dev server to confirm bookings persist (Prisma/Postgres handles storage).

### Automated integration check
Run `npx ts-node --transpile-only tests/myBookings.integration.ts` while the environment points to a Postgres database. The script provisions test data, exercises the OTP login and listing APIs, and prints `PASS` or `FAIL` before exiting non-zero on failure.

## Security considerations
* All list queries filter by `customer_phone` derived from the session, never using user-supplied phone numbers.
* API routes respond with `401` when the session is missing or expired.
* OTP verification reuses the existing `/api/otp/*` endpoints; only successful verifications issue customer sessions.
* Ensure `MB_SESSION_SECRET` is a strong, random string in production deployments.
