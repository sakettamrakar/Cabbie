# RaipurTocabs.in — Dev Environment

## Quick Start
```bash
git clone <repo>
cd cab-website
cp .env.example .env
make up
```
Open http://localhost:3000

## Framework Health Check

To verify your development environment is working correctly:

1. **Start the server:**
   ```bash
   npm run dev
   # OR with Docker:
   docker compose up -d
   ```

2. **Test baseline endpoints:**
   - Visit http://localhost:3000/test → should see "it works ✅"
   - Test API: `curl http://localhost:3000/api/health` → should return `{"ok":true}`

3. **Troubleshooting:**
   - ✅ **Both pass**: Your framework is healthy. Issues are likely database/environment/templates.
   - ❌ **Either fails**: Check port binding and basic setup in TROUBLESHOOTING.md sections A and E.
   - 🔧 **Quick diagnosis**: Run `npm run dev:doctor` for automated health checks.

## Common Commands
- `make up` — build and start containers
- `make logs` — tail app logs
- `make migrate` — run Prisma migrations inside container
- `make down` — stop containers
- `make clean` — stop and remove containers, volumes, networks

See `docs/01-environment-setup.md` for the full handbook (what/why/acceptance).

## Minimal Local (No Docker/Admin) Path
If you cannot install Docker yet:

1. Install portable Node 20 (or use nvs/nvm) without admin.
2. From project root:
	```bash
	npm install
	npm run dev
	```
3. Open http://localhost:3000
4. If you cannot install Node yet, open `lite.html` directly in a browser as a temporary visual check.

Details: `docs/02-minimal-local.md`.

## Offline Export Bundle
Produce a static bundle (no server) once you can run Node:
```bash
npm run export
```
Result: `out-offline/` directory containing static HTML/JS you can open (e.g., `out-offline/index.html`). Some dynamic Next.js features (API routes, server rendering) won’t function—this is for quick visual review only.

If you cannot run `npm run dev` due to firewall prompts, use either:
- `npm run static` (generates `static-preview.html`)
- `npm run export` (full static bundle) once dependencies are installed.

## Tests

Jest is configured with ts-jest. Run tests:

```
npm run test
```

Booking flow test covers OTP send, verify and booking creation.

## Admin Authentication

- Login page: /admin/login
- API: POST /api/admin/login { email, password }
- Sets httpOnly cookie 'admin_session' (JWT, 30m TTL, sliding refresh).
- Protects /admin/* via middleware.
- Seeded default admin user: admin@example.com / admin123 (override with ADMIN_EMAIL / ADMIN_PASSWORD env vars before seeding).
