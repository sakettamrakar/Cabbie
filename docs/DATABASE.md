# Database & Data Models

Cabbie uses Prisma as the ORM with a schema defined in [`prisma/schema.prisma`](../prisma/schema.prisma). Development defaults to SQLite (file-based), while production can target MySQL or Postgres by changing the `provider` and `DATABASE_URL`.

## 1. Entity Overview

| Model | Purpose | Key Fields |
| --- | --- | --- |
| `City` | Represents an origin/destination city or airport. | `name`, `slug`, `state`, `airport_code`, `is_active`, relations to `Route`. |
| `Route` | Directed route between two cities. | `origin_city_id`, `destination_city_id`, `distance_km`, `duration_min`, `is_airport_route`, `is_active`. |
| `Fare` | Pricing tiers for a route. | `route_id`, `car_type` (`HATCHBACK`, `SEDAN`, `SUV`), `base_fare_inr`, `night_surcharge_pct`. |
| `Offer` | Discount codes and campaigns. | `code`, `discount_type` (`FLAT`/`PCT`), `value`, `cap_inr`, `valid_from`, `valid_to`, `active`. |
| `Driver` | Driver directory for assignments. | `name`, `phone`, `car_type`, `vehicle_no`, `active`. |
| `Booking` | Customer bookings. | `route_id`, `origin_text`, `destination_text`, `pickup_datetime`, `car_type`, `fare_quote_inr`, `fare_locked_inr`, `payment_mode`, `status`, `customer_phone`, `utm_*`. |
| `Assignment` | Links bookings to drivers. | `booking_id`, `driver_id`, `status`. |
| `ContentToken` | Programmatic SEO content for routes (highlights + FAQs). | `key`, `json`, `scope`, `targetId`. |
| `User` | Admin accounts for the dashboard. | `email`, `passwordHash`, `created_at`. |

Relationships:

- `City` ⟷ `Route` (one-to-many in both directions via `destinationRoutes` / `originRoutes`).
- `Route` ⟷ `Fare`, `Booking` (one-to-many).
- `Booking` ⟷ `Assignment` ⟷ `Driver` (many-to-many via assignments).
- `Offer` is independent; booking discount linkage is stored in `Booking.discount_code`.

## 2. Schema Excerpt

```prisma
model Booking {
  id               Int      @id @default(autoincrement())
  route_id         Int
  origin_text      String
  destination_text String
  pickup_datetime  DateTime
  car_type         String
  fare_quote_inr   Int
  fare_locked_inr  Int      @default(0)
  payment_mode     String   @default("COD")
  status           String   @default("PENDING")
  customer_name    String?
  customer_phone   String
  discount_code    String?
  created_at       DateTime @default(now())
  utm_source       String?
  utm_medium       String?
  utm_campaign     String?
  assignments      Assignment[]
  route            Route    @relation(fields: [route_id], references: [id])
}
```

See the full schema for additional constraints (e.g., `Route` unique index on origin/destination, `Booking` default statuses).

## 3. Seed Data (`npm run db:seed`)

The seed script (`prisma/seed.js`) is idempotent and inserts:

- **Cities:** Raipur, Bilaspur, Bhilai, Durg, Rajnandgaon, Raigarh, Korba, Jagdalpur, Nagpur, Vizag.
- **Routes:** 10 directed pairs with distances/durations (Raipur ⇄ Bilaspur, Raipur ⇄ Nagpur, etc.).
- **Fares:** For each route — Hatchback (`distance*12 + 100`), Sedan (+₹200), SUV (+₹600).
- **Offers:** `WELCOME100` (flat ₹100) and `RAIPUR20` (20% capped at ₹500) with validity windows in 2025.
- **Drivers:** Four seed drivers (Sedan/Hatchback/SUV) with phone numbers prefixed by `+91`.
- **Content tokens:** Highlights and FAQs per route; Raipur → Bilaspur and Raipur → Nagpur have bespoke content, others fall back to generic copy.
- **Sample booking:** Pending Sedan booking on Raipur → Bilaspur route scheduled one hour from now.
- **Admin user:** `admin@example.com` / `admin123` (hash stored). Override credentials via `ADMIN_EMAIL`/`ADMIN_PASSWORD` before seeding.

Re-running the seed is safe; it uses `upsert` operations for deterministic state.

## 4. Switching Databases

1. Edit `prisma/schema.prisma` → `datasource db { provider = "mysql" }` (or `postgresql`).
2. Update `.env` → `DATABASE_URL="mysql://user:pass@localhost:3306/cabdb"` (see `docker-compose.yml`).
3. Regenerate the client: `npm run prisma:generate`.
4. Run migrations: `npm run db:migrate` (for dev) or `npm run db:migrate:deploy` (for production).
5. Seed the database: `npm run db:seed` (works across providers).

For MySQL in Docker, credentials are defined in `docker-compose.yml` (`MYSQL_ROOT_PASSWORD=root`, `MYSQL_DATABASE=cabdb`). Create an application user instead of root for production deployments.

## 5. Example Queries

```ts
// Fetch active routes with fares
const routes = await prisma.route.findMany({
  where: { is_active: true },
  include: {
    origin: true,
    destination: true,
    fares: true,
  },
});

// Insert a manual booking override
await prisma.booking.create({
  data: {
    route_id: 1,
    origin_text: 'Raipur Airport',
    destination_text: 'Bilaspur Station',
    pickup_datetime: new Date('2025-05-20T09:00:00Z'),
    car_type: 'SUV',
    fare_quote_inr: 2200,
    fare_locked_inr: 2200,
    customer_phone: '9876543210',
    status: 'PENDING',
  },
});

// Apply an offer to a booking retroactively
await prisma.booking.update({
  where: { id: 42 },
  data: { discount_code: 'RAIPUR20', fare_locked_inr: 1800 },
});
```

## 6. Content Tokens

Content tokens power SEO-rich sections on fare pages (Why ride with us?, FAQs).

- Keys follow `highlights:<origin>-<destination>` and `faqs:<origin>-<destination>`.
- JSON payloads are arbitrary; the UI expects `{ "highlights": string[] }` or `{ "faqs": [{ "q": string, "a": string }] }`.
- Use `prisma.contentToken.upsert` to modify or add entries.

## 7. Maintaining Data Integrity

- `Route` has a composite unique constraint (`origin_city_id`, `destination_city_id`) preventing duplicates.
- `Assignment` enforces unique `(booking_id, driver_id)` pairs.
- Phone numbers should be normalized via `lib/validate.ts` before inserting new bookings.
- Use Prisma transactions if you introduce multi-step operations involving bookings + assignments.

## 8. Backups & Migration Strategy

- SQLite: copy the `cabdb.sqlite` file (consider storing in object storage). Automate exports before deployments.
- MySQL/Postgres: rely on managed service snapshots or scheduled dumps (e.g., `mysqldump`, `pg_dump`).
- Seeds are idempotent but not a replacement for backups—retain production data separately.

## 9. Data Access Patterns

- API routes use a single `PrismaClient` instance per module (imported at top-level). Next.js hot reload handles reusing the instance.
- Long-running scripts should `await prisma.$disconnect()` when finished (see `prisma/seed.js`).
- When running in serverless environments, instantiate Prisma per request or use connection pooling according to the hosting provider’s guidelines.
