# Section 1: Environment Setup (Developer Handbook)

> Goal: Clone, boot, migrate, seed, verify, teardown, and rebuild the stack in <15 minutes on a clean laptop. Living contract: if a step fails, create an issue tagged `env-setup`.

## 1.1 Purpose of Environment Setup
**Task:** Standardize local runtime (app + MySQL + Redis) in code.

**Why:**
- Removes “works on my machine”.
- One-command onboarding.
- Matches CI containers.
- Surfaces integration issues early.
- Infra history becomes reviewable code.

**Acceptance:** Fresh laptop → clone → copy `.env.example` → `make up` → placeholder at http://localhost:3000; teardown + rebuild behaves identically.

## 1.2 Core Components & Topology
| Component | Role | Image | Port | Persistence | Notes |
|-----------|------|-------|------|-------------|-------|
| app | Next.js UI + API | node:20-alpine | 3000 | Bind-mounted source | Hot reload |
| db | MySQL store | mysql:8 | 3306 | Anonymous volume | Healthcheck |
| redis | Cache / ephemeral queues | redis:alpine | 6379 | In-memory | No persistence yet |

Internal DNS: `db`, `redis` resolve automatically.

**Acceptance:** `docker ps` lists only `cab_app`, `cab_db`, `cab_redis`.

## 1.3 System Requirements
- OS: macOS, Linux, or Windows 10/11 + WSL2.
- RAM: 8GB min (16GB recommended).
- Disk: 10GB free.
- Installed: Docker, Git, VS Code (Docker, ESLint, Prisma extensions), optional Make.

**Verify:**
```
docker -v
git --version
code --version
```
**Acceptance:** Versions print; `docker compose` works.

## 1.4 Project Initialization
Documented for reproducibility:
```
mkdir cab-website && cd cab-website
git init
```
Add `.gitignore` early.

**Hygiene:** Don’t commit `.env`; later add lockfile; separate infra vs feature commits.

**Acceptance:** `git status` clean; no `node_modules` / secrets tracked.

## 1.5 Environment Variables Strategy
Copy `.env.example` → `.env`. Prisma uses `DATABASE_URL` composed from discrete vars.

**Excerpt:**
```
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=cabdb
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
REDIS_HOST=redis
REDIS_PORT=6379
```
Future public vars require `NEXT_PUBLIC_` prefix.

**Why:** Decouples config, eases rotation, supports per-env overrides.

**Acceptance:** `printenv DATABASE_URL` inside container expands; altering a DB var & restarting changes connection behavior.

## 1.6 Dockerfile & Build Context
Highlights:
- Base Node 20 Alpine.
- `npm ci || npm install` (fallback until lockfile committed).
- Port 3000 exposed; live reload via bind mount.

**Not Multi-Stage Yet:** Optimize later; simplicity now.

**Acceptance:** `docker compose build app` succeeds; changes to `package.json` invalidate cache.

## 1.7 docker-compose.yml Orchestration
Three services, minimal config. DB healthcheck pings until ready; `depends_on` sequences startup.

**Future Options:** Named volumes, restart policies, resource limits, explicit networks.

**Acceptance:** `docker compose ps` shows DB becomes `healthy`; app stays up.

## 1.8 Prisma Placeholder
`schema.prisma` has `_Placeholder` model. Enables early migration & client generation workflow.

**Flow (future real schema):** Edit schema → `make migrate` → commit migration + schema → teammates run `make migrate`.

**Acceptance:** `make migrate` (with deps installed) runs without connection errors.

## 1.9 Local Development Workflow
1. Copy env: `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`).
2. Start: `make up` (or `docker compose up -d --build`).
3. Migrate: `make migrate` (creates/applies migration; safe to rerun).
4. Seed (optional): `make seed`.
5. Browse: http://localhost:3000.
6. Logs: `make logs`.
7. Shell: `make shell`.
8. Teardown: `make down`; full reset: `make clean`.

**Why:** Single documented path keeps team workflows aligned.

**Acceptance:** Following only list yields working page and repeatable clean rebuild.

## 1.10 Reset & Reproducibility
`make clean` prunes containers, volumes, dangling images. Acceptable early because data is disposable. Later we’ll preserve named volumes by default and provide a harsher `nuke` target.

**Tradeoffs:** Data loss (intentional now); slightly longer rebuild (acceptable). Clear docs prevent surprise.

**Acceptance:** `make clean` → `make up` restores healthy app; prior DB rows gone.

## 1.11 Troubleshooting Matrix
| Symptom | Cause | Fix |
|---------|-------|-----|
| 3000 busy | Other service | Map `3001:3000`; restart. |
| 3306 busy | Local MySQL | Map `3307:3306` or stop local instance. |
| App → DB fail | DB not healthy | Wait; check `docker compose ps`; view DB logs. |
| Missing env vars | No `.env` | Copy example; restart app. |
| Restart loop | Crash / missing dep | `make logs`; fix; rebuild. |
| Slow reload (Win) | Non-WSL path | Use WSL2 filesystem. |
| Migration error | Prisma deps not built | Rebuild container; rerun `make migrate`. |

**Acceptance:** Each issue resolvable via listed fix.

## 1.12 Acceptance Summary Checklist
- [x] Repo + `.gitignore` established.
- [x] Dockerfile + compose define app, db, redis; start succeeds.
- [x] `.env.example` lists required vars + `DATABASE_URL`.
- [x] Placeholder page at http://localhost:3000.
- [x] Make targets: `up`, `down`, `clean`, `logs`, `seed`, `migrate`, `ps`, `shell`.
- [x] Full teardown & rebuild validated.
- [x] Troubleshooting table present.
- [x] Prisma placeholder enables migrations.

## 1.13 Next Improvements (Out of Scope Now)
- Commit lockfile + enforce pure `npm ci`.
- Multi-stage production image.
- Named MySQL volume + optional Redis persistence.
- ESLint, Prettier, CI pipeline.
- Health/readiness endpoint + app healthcheck.
- Real domain schema & seed data (Rides, Drivers, Bookings, Payments).
- Auto-copy `.env.example` at startup if missing.

---
Re-run this checklist after infra changes to keep developer experience friction‑free.
