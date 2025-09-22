# Section 2: Database Schema & Seeders

## Quick Start (SQLite Dev)
```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
# npm run dev (if server allowed)
# Visit http://localhost:3000/raipur/bilaspur/fare
```

## Reset (No Admin)
```bash
npm run db:reset
```

## Switch to Postgres
1. Set DATABASE_URL to Postgres connection string.
2. Adjust provider to postgresql (or use schema.postgres.prisma copy).
3. Run prisma generate & migrations/deploy.

## Notes
- Idempotent seeds.
- Composite uniqueness on routes prevents duplicates.
- SQLite file can be deleted and rebuilt.

## 2.11 Detailed Seed Data (Cities & Routes)
Seed inserts 10 cities (Raipur, Bilaspur, Bhilai, Durg, Rajnandgaon, Raigarh, Korba, Jagdalpur, Nagpur, Vizag) and 10 routes with distance_km & duration_min:

| Origin | Destination | Km | Min |
|--------|-------------|----|-----|
| raipur | bilaspur | 120 | 150 |
| bilaspur | raipur | 120 | 150 |
| raipur | bhilai | 35 | 60 |
| raipur | durg | 40 | 70 |
| raipur | rajnandgaon | 75 | 120 |
| raipur | raigarh | 250 | 300 |
| raipur | korba | 200 | 240 |
| raipur | jagdalpur | 280 | 420 |
| raipur | nagpur | 290 | 360 |
| raipur | vizag | 530 | 660 |

## 2.12 Fare Seeding Strategy
Formula per route: hatchback = distance*12 + 100; sedan = +200; suv = +600. Three fare rows per route. Ensures scaled pricing from short to long haul.

## 2.13 Content Tokens
For each route two tokens are stored (highlights:<origin>-<destination>, faqs:<origin>-<destination>). Raipur→Bilaspur and Raipur→Nagpur have custom curated content; others receive generic fallback plus distance FAQ. Fare page renders highlights under "Why ride with us?" if present.

## 2.14 Mock Offers
Two offers (upsert idempotent):
- WELCOME100: FLAT ₹100 off fares >= 1000 (2025 full year)
- RAIPUR20: 20% off Raipur-origin (cap ₹500) valid Jun–Aug 2025
Offer application logic in API: query param ?offer=CODE returns final_fare_inr, discount_inr per car type with cap enforcement.

## 2.15 Developer Checklist
- [x] 10 Cities
- [x] 10 Routes
- [x] 3 Fares per route via formula
- [x] Content tokens (highlights + FAQs) for every route
- [x] 2 Offers (flat + pct w/ cap)
- [x] Idempotent seeding (upserts)
- [x] Visibility page: /routes (SSR) lists >=10 routes
- [x] /raipur/bilaspur/fare and /raipur/nagpur/fare resolve with distances & fares
- [x] SEO page /raipur/raipur-to-bilaspur-taxi shows FAQ list in <dl>

## Section 3: Static Generation & ISR (Summary)
- Route fare pages and SEO pages (root-level origin-to-destination) use getStaticPaths + getStaticProps with revalidate 86400.
- Rewrites expose friendly canonical path /{origin}/{origin}-to-{destination}-taxi.html pointing to root dynamic page.
- City hub pages (/city/{city}) and routes index (/routes.html) statically regenerated daily.
- Sitemap now generated via script `npm run sitemap` (also runs automatically after `npm run build`) writing to `public/sitemap.xml`.
- Canonical tags + JSON-LD FAQ schema included.
- Use: `npm run build && npx next export` (or existing export script) for static HTML.

## Verify Key Pages
1. Run: `npm run dev`
2. Visit: /routes, /raipur/bilaspur/fare, /raipur/nagpur/fare, /raipur/raipur-to-bilaspur-taxi
3. Optional offers test: /raipur/bilaspur/fare?offer=WELCOME100

## Re-run Seeds Safely
`npm run db:seed` can be run repeatedly; it updates or creates without duplications.

## Troubleshooting
- Provider mismatch: ensure schema provider matches DB.
- Locked file: close dev server or Studio before reset.