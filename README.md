# Atlas

Atlas indexes GitHub repository data into PostgreSQL so engineering context can
be explored from a web application.

## Workspace

- `apps/atlas-web`: Next.js frontend and GitHub App installation experience.
- `apps/atlas-indexer`: Fastify API, webhook receiver, and ingestion service.
- `packages/contracts`: shared Zod API contracts.
- `packages/database`: Drizzle schema and database client.
- `packages/github`: GitHub App integration.
- `packages/config`: environment parsing.
- `packages/logging`: structured logging.

## Local development

Requirements:

- Node.js 24 or newer
- pnpm 11

Install and run both applications:

```sh
pnpm install
pnpm dev
```

The services run at:

- Atlas Web: `http://localhost:3000`
- Atlas Indexer: `http://localhost:4000`
- Indexer health check: `http://localhost:4000/v1/health`

Copy `.env.example` to `.env` when local secrets and infrastructure are added.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm build
```

## Current milestone

The monorepo and web-to-indexer health path are established. The next milestone
is the authenticated GitHub App installation flow.
