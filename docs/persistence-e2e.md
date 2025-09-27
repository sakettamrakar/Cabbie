# Booking Persistence E2E Check

This flow verifies that customer bookings created through the simplified booking API are persisted to Postgres and remain available across server restarts.

## Prerequisites

1. Copy the example environment file and update `DATABASE_URL` to point at a running Postgres instance (defaults match `docker-compose`):
   ```bash
   cp .env.example .env
   # adjust DATABASE_URL if needed
   ```
2. Install dependencies if you have not already:
   ```bash
   npm install
   ```
3. Ensure Postgres is running. The provided `docker-compose.yml` spins up a compatible instance:
   ```bash
   docker compose up db -d
   ```

## Running the check

```bash
npm run db:migrate
npm run dev:start
npm run e2e:persist
npm run dev:stop
```

The script will:

1. Apply any pending Prisma migrations (`prisma migrate deploy`).
2. Start the Next.js server in the background and wait for `/api/v1/health` to respond.
3. Create three unique bookings via `POST /api/bookings/simple`.
4. Confirm the booking count increases by ≥3 using Prisma.
5. Fetch each booking through `/api/v1/bookings/:id` to simulate the “My Bookings” manage endpoint.
6. Stop the server, re-check the count, restart the server, and verify the bookings persist.
7. Stop the server once verification completes and report **PASS/FAIL**.

## Troubleshooting

- **Count stays at 1:**
  - Ensure requests include unique payloads so idempotency is not triggered elsewhere.
  - Confirm `DATABASE_URL` points to Postgres and not a leftover SQLite file.
  - Check that no seed/reset script truncates `Booking` during startup.
- **Cannot connect to Postgres:** verify the container/service is running and credentials match `.env`.
- **`/api/v1/health` never becomes ready:** run `npm run dev` manually to inspect runtime errors, then retry the E2E script.
- **Bookings missing after restart:** look for destructive logic executed on server start or migrations that reset sequences.

Use `npm run prisma:check` at any time to print the total booking count and the most recent booking IDs for quick inspection.
