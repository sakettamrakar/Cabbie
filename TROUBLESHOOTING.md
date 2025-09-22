# Troubleshooting (Quick Reference)

A full, maintained troubleshooting matrix lives in [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md). Use this file as a quick primer and pointer.

## Fast Checks

1. `node -v` → ensure Node 20.x is active.
2. `npm run dev:doctor` → automated diagnostics for Docker, ports, Prisma, and environment variables.
3. Hit health endpoints:
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:3000/api/v1/health
   ```
4. Verify the dev server on http://localhost:3000/test renders `it works ✅`.

## Common Links

- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — Symptom → fix tables for ports, env vars, Prisma, OTP, booking, search, admin, and testing.
- [docs/SETUP.md](docs/SETUP.md) — End-to-end environment setup and database reset instructions.
- [docs/FAQ.md](docs/FAQ.md) — Known limitations and quick answers.
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — Deployment, logging, and monitoring runbooks.

## When Escalating

Gather the following before opening an issue or asking for help:

- Output from `npm run dev:doctor`.
- Exact request/response payloads (sanitized) related to the failure.
- Relevant environment variables (omit secrets).
- Console output, Docker logs, or server logs showing the error.

Providing this context speeds up triage and keeps the troubleshooting guide accurate.
