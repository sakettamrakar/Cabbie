# Contributing Guide

Welcome to Cabbie! This guide outlines how to propose changes, run checks, and collaborate effectively with maintainers and AI coding assistants.

## 1. Ground Rules

- Target Node 20.x and npm 10.x.
- Do not commit secrets or `.env` files.
- Avoid modifying production data directly; use migrations + seeds.
- Keep documentation up to date with code changes (see [docs/README.md](docs/README.md)).

## 2. Branch & Commit Strategy

| Item | Convention |
| --- | --- |
| Branch naming | `feature/<slug>`, `fix/<slug>`, or `docs/<slug>` (lowercase, hyphenated). |
| Commit style | Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). |
| Pull request checklist | Describe changes, link to relevant docs/tests, include screenshots for UI updates. |

Avoid force-pushing to shared branches. If you need to rework a PR, add incremental commits and squash on merge.

## 3. Development Workflow

1. Fork and clone the repository.
2. Install dependencies: `npm install`.
3. Sync Prisma client & DB: `npm run prisma:generate`, `npm run db:migrate`, `npm run db:seed`.
4. Start dev server: `npm run dev`.
5. Make changes in TypeScript files (`.ts`, `.tsx`) unless you are editing legacy `.js` modules intentionally.

## 4. Testing & Quality Gates

| Command | Purpose |
| --- | --- |
| `npm run test` | Jest unit/integration tests. |
| `npm run test:pw` | Playwright E2E tests (requires dev server on :3000). |
| `npm run axe:contrast` / `npm run test:a11y:axe` | Accessibility regression checks. |
| `npx eslint . --ext .ts,.tsx` | Lint TypeScript/React source (run manually before PR). |
| `npm run check:budgets` | Performance budget verification. |

All commands must pass before maintainers review a PR. Document any intentionally skipped checks in the PR description.

## 5. Database Changes

- Update `prisma/schema.prisma` and run `npm run db:migrate -- --name <migration-name>`.
- Commit migration files under `prisma/migrations/`.
- Update `prisma/seed.js` if new tables or columns require seed data.
- Document the change in [docs/DATABASE.md](docs/DATABASE.md) and mention in the PR.

## 6. Documentation Expectations

- Update README or relevant docs when behavior changes.
- Add new entries to [docs/README.md](docs/README.md) for any new documentation file.
- Keep API contract updates synchronized with [docs/API.md](docs/API.md).
- For UI changes, note accessibility considerations in the PR (keyboard access, ARIA attributes, contrast results).

## 7. Code Style & Patterns

- Prefer functional React components with hooks.
- Use TypeScript types/interfaces for props and function signatures.
- Reuse helpers from `lib/` (e.g., `lib/validate.ts`, `lib/errors.ts`) rather than duplicating logic.
- Favor async/await with proper error handling via `withApi` and `makeError`.
- Log sparingly; production logs should remain clean.

## 8. Review Process

1. Open a PR against the `main` branch.
2. Fill in the PR template (summary, testing evidence, screenshots if applicable).
3. Maintainers will review within 1–2 business days. Expect feedback on tests, docs, or architecture alignment.
4. Resolve comments via follow-up commits. Once approved, squash-merge unless otherwise requested.

## 9. Working with AI Coding Assistants

- Reference this guide in prompts so generated changes respect conventions.
- Ensure AI-generated code includes TypeScript types and error handling consistent with existing patterns.
- Run formatting/linting after AI changes to avoid style drift.

## 10. Getting Help

- Open a GitHub Discussion or issue for architecture questions.
- Tag maintainers in PRs for urgent reviews (use sparingly).
- Share logs, reproduction steps, and environment info when reporting bugs (see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)).

Thanks for contributing! Keeping docs, tests, and code aligned ensures fast onboarding for both humans and AI collaborators.
