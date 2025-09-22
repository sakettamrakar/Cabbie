# Cabbie Documentation Index

Welcome to the Cabbie developer handbook. This index links to the canonical documentation that lives alongside the codebase. All files use Markdown and live under the `docs/` directory unless noted otherwise.

| File | Purpose |
| --- | --- |
| [SETUP.md](SETUP.md) | End-to-end environment setup for macOS, Linux, Windows (with/without Docker) and seed data instructions. |
| [USAGE.md](USAGE.md) | Day-to-day workflows: running the dev server, building for production, verifying booking flows, and sample diagnostics. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | High-level system architecture, runtime topology, key modules, and request/data lifecycle diagrams. |
| [DATABASE.md](DATABASE.md) | Prisma schema reference, ERD, seed data, and migration strategy for SQLite (dev) and MySQL/Postgres (prod). |
| [API.md](API.md) | HTTP endpoint contracts including payloads, authentication, rate limits, and error envelopes. |
| [STYLEGUIDE.md](STYLEGUIDE.md) | UI design system, typography/spacing tokens, React component conventions, and accessibility checklist. |
| [OPERATIONS.md](OPERATIONS.md) | Deployment playbooks, environment configuration, CI/CD, secrets, logging, monitoring, and backup guidance. |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues with quick triage steps, diagnostic commands, and remediation recipes. |
| [FAQ.md](FAQ.md) | Frequently asked questions, known limitations, and escalation paths. |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution standards, code review expectations, and release checklist (lives at repo root). |
| [README.md](../README.md) | Project overview and quick start (repo root). |
| [docs/archive/](archive/) | Legacy documentation retained for historical context; contents are superseded by the files above. |

> **Tip:** When updating or adding documentation, also update this index so new contributors and AI assistants can find your work quickly.
