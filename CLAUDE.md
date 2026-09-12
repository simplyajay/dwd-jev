## Scope for this project

This is a monorepo with `apps/desktop/`, `apps/backend/`, and `packages/shared/`.

- If you are running on native Windows: you are the **frontend** session.
  Work only in `apps/desktop/` and `packages/shared/`. Never read, edit, or create files under `apps/backend/`.

- If you are running under WSL2 / Linux: you are the **backend** session.
  Work only in `apps/backend/` and `packages/shared/`. Never read, edit, or create files under `apps/desktop/`.

---

## Backend stack (apps/backend only)

The sections below describe `apps/backend`'s implementation. They apply to the
backend session only. If you are the frontend session, treat this as background
context for understanding what the API expects — do not implement, suggest
changes to, or run commands against any of this.

### Redis

- Redis runs locally via Docker Compose, defined in `apps/backend/docker-compose.yml`.
  It is NOT a managed/cloud service — it runs on the same host as the backend, always.
- Before starting the dev server, Redis must be running: `docker compose up -d`
  (run from `apps/backend/`).
- The app connects to it via `REDIS_URL=redis://localhost:6379` (set in `.env`).
- Do not suggest or add a managed Redis provider (Upstash, Redis Cloud, etc.) — this
  is a deliberate same-host decision, not a placeholder.
- Redis holds only ephemeral data (sessions, cache, rate-limiting) — no persistence
  volume is configured, and that's intentional. Don't add one unless explicitly asked.

### Database

- Postgres is cloud-hosted (not in Docker) — `DATABASE_URL` in `.env` points to it.
- Prisma schema lives at `apps/backend/prisma/schema.prisma`.
- Run migrations with `npx prisma migrate dev` (dev) — never `db push` against the
  shared cloud DB without asking first.

### Stack

- Node.js + Express + TypeScript, run with `tsx watch` in dev.
- ioredis for Redis, @prisma/client for Postgres.

---

Changes to `packages/shared/` affect both sides — flag anything there that could break the other consumer.
