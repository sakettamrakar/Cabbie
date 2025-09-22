# CI / CD Guide

This repository ships with a single consolidated GitHub Actions workflow (`CI`) that validates code quality, produces build artifacts, and keeps an eye on bundle/performance regressions. This document explains when the workflow runs, what each job does, and how to debug or reproduce the checks locally.

## When the workflow runs

`CI` triggers automatically in the following situations:

- Pushes to the `main` branch (docs-only and Markdown-only commits are skipped).
- Pull requests that target `main`.
- Manual runs from the **Actions ▸ CI ▸ Run workflow** button (via `workflow_dispatch`).

Concurrency control cancels superseded runs on the same branch, keeping the queue short.

## Permissions and security

The workflow uses least-privilege permissions (`contents: read`, `pull-requests: write`) and relies on the default GitHub token. No long-lived secrets are required. All jobs execute on the hosted `ubuntu-latest` runner.

## Shared runtime setup

All jobs use Node.js (18 or 20 depending on the matrix) via `actions/setup-node@v4` with npm cache enabled. We pin dependencies with `npm ci`. A temporary SQLite database (`DATABASE_URL=file:./tmp/ci.db`) is used in CI. Prisma migrations are pushed (`prisma db push`) and the seed script is executed (`npm run db:seed`) to make sure builds, tests, and bundle checks have the domain data they expect. Large builds receive extra heap headroom via `NODE_OPTIONS=--max_old_space_size=4096`.

## Job overview

### 1. Lint & Type Check
- Runs ESLint through `next lint` and a TypeScript no-emit compile.
- Generates the Prisma client so type checks resolve database types.
- Adds a summary block to the workflow run for quick status scanning.

### 2. Unit tests (Node 18 & 20)
- Executes Jest (`npm test -- --coverage --runInBand`) against a seeded SQLite database.
- Collects coverage output and uploads it as an artifact (captured on the Node 20 shard).
- Publishes coverage percentages into the job summary.

### 3. Build
- Builds the production Next.js bundle (`npm run build`) after preparing Prisma/SQLite.
- Uploads the `.next` build output and generated sitemap files so deployments can re-use them or for further inspection.

### 4. Bundle & Lighthouse audit
- Rebuilds with the bundle analyzer enabled, enforces bundle budgets, and captures analyzer output as artifacts.
- Boots the production server (`next start`) against the seeded database, waits for readiness, and runs the scripted Lighthouse checks (`npm run lh:ci`).
- Uploads Lighthouse JSON reports for regression review.

### 5. Dependency audit (non-blocking)
- Runs `npm audit --omit=dev` to capture a security snapshot without failing the workflow.
- Archives the raw JSON report for further triage.

## Artifacts

| Artifact | Produced by | Contents |
| --- | --- | --- |
| `coverage-report` | Unit tests (Node 20) | Jest coverage directory including `lcov.info`. |
| `next-build` | Build job | `.next` output and generated sitemap XML. |
| `bundle-analysis` | Bundle audit | Analyzer stats / reports (`analyze`, `.next/analyze`). |
| `lighthouse-reports` | Bundle audit | Lighthouse JSON results. |
| `npm-audit` | Dependency audit | Raw `npm audit` JSON snapshot. |

Artifacts are available from the run summary sidebar under the *Artifacts* section.

## Reproducing locally

1. Install dependencies: `npm ci`.
2. Prepare the SQLite database used in CI:
   ```bash
   export DATABASE_URL="file:./tmp/dev.db"
   mkdir -p tmp
   npx prisma db push --skip-generate
   npm run db:seed
   ```
3. Run the checks you care about:
   - Lint: `npx next lint --max-warnings=0`
   - Type check: `npx tsc --noEmit --pretty false`
   - Unit tests: `npm test -- --coverage --runInBand`
   - Production build: `npm run build`
   - Bundle analyzer: `npm run analyze`
   - Lighthouse audit (requires the app running locally): `npm run lh:serve` (in one shell) then `npm run lh:ci` (in another).

## Debugging tips

- Use the job summaries at the top of each run for high-level pass/fail hints. For deeper inspection, open the job logs in the Actions UI.
- When a step fails, the log includes the exact command executed. Copy it locally after running the SQLite preparation commands above to reproduce.
- Coverage results live in `coverage/coverage-summary.json`; the workflow extracts the line percentage for the summary.
- Bundle and Lighthouse regressions ship their reports as artifacts—download them from the Actions run to compare against previous builds.
- The dependency audit is non-blocking; inspect `npm-audit/audit.json` to prioritize fixes when the summary lists outstanding issues.

