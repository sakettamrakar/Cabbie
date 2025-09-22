# Environment Setup

This guide walks through setting up Cabbie for local development without requiring administrator access. It covers native Node.js installs, optional Docker services, database seeding, and post-setup validation.

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.x (see [`.nvmrc`](../.nvmrc)) | Use nvm, Volta, or Node installers that do not require admin rights. |
| npm | 10.x+ | Ships with Node 20. |
| Git | Any recent version | Needed to clone and manage commits. |
| SQLite | Bundled with Prisma | No manual install required; database file lives in the repo. |
| Optional: Docker | Desktop ≥ 4.x | Provides MySQL + Redis containers if you prefer service parity. |

> **Note:** Redis is optional during development. When `REDIS_URL` is unset the OTP/idempotency modules fall back to in-memory stores.

## 2. Clone and Install Dependencies

```bash
# Clone and enter the repo
git clone <repo-url>
cd Cabbie

# Use Node 20 (nvm example)
nvm install 20
nvm use 20

# Install packages
npm install
```

The repository is TypeScript-first but ships compiled JavaScript for backwards compatibility. Running `npm install` will also execute `postinstall` scripts defined in `package.json`.

## 3. Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```
2. Review the variables:

   | Variable | Description | Default |
   | --- | --- | --- |
   | `BRAND_NAME` | Display name rendered in headers, SEO tags, and static exports. | `Raipur Cabs` |
   | `SITE_DOMAIN` | Used to build absolute URLs and sitemaps. | `localhost:3000`
   | `DATABASE_URL` | Prisma connection string. Defaults to SQLite file `cabdb.sqlite`. | `file:./cabdb.sqlite` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Only used during seeding to create the admin account. | `admin@example.com` / `admin123` |
   | `ADMIN_JWT_SECRET` | Secret for `/api/admin/login` JWT cookies. | `dev_admin_secret_change_me` |
   | `BOOKING_HASH_SALT` | Salt for hashing booking IDs before sending to analytics. | `s1` |
   | `GA4_MEASUREMENT_ID` / `GA4_API_SECRET` | Enable GA4 Measurement Protocol server events. | Empty |
   | `REDIS_URL` | Optional Redis connection string for OTP, idempotency, and rate limiting. | Empty |
   | `GOOGLE_PLACES_API_KEY` / `GOOGLE_MAPS_API_KEY` | Enables real distance + autocomplete APIs. | Empty |

3. If you plan to run the Docker services, align `DATABASE_URL` with the containerized database (see [Operations](OPERATIONS.md)).

## 4. Database Bootstrapping

Cabbie ships with Prisma migrations and an idempotent seed script.

```bash
npm run prisma:generate   # Generates the Prisma client
npm run db:migrate        # Applies migrations (SQLite by default)
npm run db:seed           # Inserts cities, routes, fares, offers, drivers, sample booking, admin user
```

Re-run `npm run db:seed` whenever you need to refresh non-destructive content. Use `npm run db:reset` to drop and recreate the schema from scratch (it internally runs migrate + seed).

## 5. Optional: Run Supporting Services with Docker

```bash
# Start Next.js + MySQL + Redis
docker compose up -d

# Tail logs if needed
docker compose logs -f app
```

- `docker-compose.yml` provisions MySQL 8 (`cab_db`) and Redis (`cab_redis`).
- Update `.env` with a MySQL `DATABASE_URL` if you want Prisma to target the container instead of SQLite.
- For lightweight local hacking, you can skip Docker entirely and stay on SQLite.

## 6. Verify Your Setup

1. Start the dev server:
   ```bash
   npm run dev
   ```
2. Visit http://localhost:3000/test — the page should render `it works ✅`.
3. Hit the health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   # => {"ok":true}
   ```
4. Run the automated doctor if something misbehaves:
   ```bash
   npm run dev:doctor
   ```
   The script checks Docker availability, port binding, Prisma connectivity, and more (see [`scripts/dev-diagnose.sh`](../scripts/dev-diagnose.sh)).

## 7. Updating the Schema

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate` to create a new migration.
3. Commit the generated migration files alongside any schema updates.
4. Re-run `npm run db:seed` if the seed data needs to include new tables or columns.

## 8. Cleaning Up

- `npm run db:reset` — Drop and recreate the database.
- `rm cabdb.sqlite` — Remove the SQLite file manually (Prisma will recreate it on the next migration).
- `docker compose down -v` — Stop and remove Docker containers and volumes.

## 9. Next Steps

After setup, continue with:

- [USAGE.md](USAGE.md) to learn the booking and search workflows.
- [API.md](API.md) to inspect the backend contracts before integrating external clients.
- [DATABASE.md](DATABASE.md) for a deeper look at entities and relationships.
