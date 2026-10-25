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

### Database

- Postgres is the only datastore. There is no Redis and no cache: refresh tokens,
  rate limits and auth state all live in Postgres, and auth state is read from the
  DB on every request.
- Redis was removed deliberately (single host, at most ~1,000 users). Don't add Redis
  or another cache back unless asked. The last version with Redis is tagged
  `redis-cache-reference`.
- Dev: Postgres runs locally via Docker Compose (`apps/backend/docker-compose.yml`).
  Start it with `docker compose up -d` from `apps/backend/` before the dev server.
  Connection settings are in `apps/backend/.env.dev`.
- Production: cloud-hosted Postgres (Neon), configured in `apps/backend/.env.prod`.
- Prisma schema lives at `apps/backend/prisma/schema.prisma`.
- Expired refresh tokens and rate-limit rows are swept hourly (`src/sweeps.ts`).
- No state is held in process memory, so running more than one backend process is safe.

### Migrations

- Claude never runs `prisma migrate` (dev or deploy) or `db push`. Flag that a
  migration is needed and suggest a name; the user runs it.
- `prisma generate` and `prisma format` are fine. `prisma validate` needs
  `npx dotenv -e .env.dev -- prisma validate`.
- After the user generates a migration, check its SQL doesn't drop the four
  hand-written `jev_*_active_key` partial unique indexes, and remind the user to run
  `pnpm check:indexes` from `apps/backend/`.

### Stack

- Node.js + Express + TypeScript, run with `tsx watch` in dev (port 3456, routes
  under `/api`).
- @prisma/client for Postgres.

### Hosting (undecided: cloud or LAN, single host)

- LAN: `req.ip` is the real client IP, so `trust proxy` stays unset.
- Cloud: run in the same region as Neon, use Neon's pooled connection string with
  `directUrl` for migrations, and set `trust proxy` to the exact number of proxy hops.

---

Changes to `packages/shared/` affect both sides — flag anything there that could break the other consumer.
