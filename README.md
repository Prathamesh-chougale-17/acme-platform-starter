# Acme Platform

Production-grade full-stack monorepo starter built with Turborepo, Next.js, Hono, Drizzle, PostgreSQL, and a local Grafana observability stack.

## Setup Strategy

This starter uses official scaffolding first and then layers shared workspace packages for contracts, logging, observability, configuration, and database access. The frontend and backend stay thin by consuming transport-neutral Zod DTOs from `@acme/shared` and repository utilities from `@acme/db`.

## Exact Scaffold Commands

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm dlx create-turbo@latest acme-platform --package-manager pnpm --skip-install
cd acme-platform
node -e "const fs=require('node:fs'); ['apps/web','apps/docs','packages/ui'].forEach((p)=>fs.rmSync(p,{recursive:true,force:true}))"
pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --use-pnpm --skip-install --yes
pnpm create hono@latest apps/api --template nodejs --pm pnpm
pnpm create playwright@latest apps/web-e2e --lang=TypeScript --quiet --no-examples --no-browsers
pnpm install
pnpm exec husky init
```

Note: in this Codex environment the Sentry wizard itself was blocked by a non-interactive TTY requirement, so the repo includes the equivalent Next.js Sentry placeholder files manually.

## Workspace Layout

```text
apps/
  api/        Hono API with services, metrics, and structured error handling
  web/        Next.js App Router frontend
  web-e2e/    Playwright smoke-test placeholder
packages/
  config/         Zod-based env loaders
  db/             Drizzle schema, migrations, repositories
  eslint-config/  Shared flat ESLint configs
  logger/         Reusable Pino setup with Loki shipping
  observability/  OpenTelemetry bootstrap and trace helpers
  shared/         Shared DTOs, response envelopes, constants
  typescript-config/ Shared TS presets
  ui/             Shared UI primitives
infra/
  observability/  Grafana, Loki, Tempo, Prometheus, OTel Collector configs
```

## Core Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Local Development

1. Copy `.env.example` to `.env` for root-level infrastructure variables.
2. Copy `apps/api/.env.example` to `apps/api/.env` for API and database tooling.
3. Start infrastructure:

   ```bash
   docker compose up -d
   ```

4. Generate the initial migration if you want to refresh it:

   ```bash
   pnpm db:generate
   ```

5. Run the apps:

   ```bash
   pnpm dev
   ```

6. Open:
   - Web: `http://localhost:3000`
   - API: `http://localhost:3001/api/v1/health`
   - Grafana: `http://localhost:3002`
   - Prometheus: `http://localhost:9090`

## Architecture Notes

- `apps/api` exposes versioned routes under `/api/v1` plus `/metrics`.
- Shared Zod schemas and response envelopes live in `@acme/shared`.
- Repositories live in `@acme/db`; route handlers delegate to services instead of touching persistence directly.
- `@acme/logger` emits pretty local logs and can push structured logs straight to Loki.
- `@acme/observability` exports Node OTel bootstrapping and request span helpers.
- Frontend pages use a typed API client instead of importing route handlers or server internals.

## Observability Flow

- API traces: `apps/api` -> OTel Collector -> Tempo
- API metrics: `apps/api:/metrics` -> Prometheus -> Grafana
- API logs: `@acme/logger` -> Loki -> Grafana

The Grafana datasources and an overview dashboard are provisioned automatically from `infra/observability/grafana/provisioning`.

## Testing

- `packages/shared`: sample contract parsing test
- `packages/config`: env validation tests
- `packages/logger`: logger binding serialization test
- `apps/api`: route-level integration tests using `app.request()`
- `apps/web-e2e`: Playwright smoke-test placeholder
