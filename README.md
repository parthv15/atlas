# Atlas

Atlas is a workspace-oriented application prototype.

## Workspace

- `apps/atlas-web`: Next.js application, authentication, and workspaces.
- `apps/atlas-indexer`: Fastify service with a versioned health API.
- `packages/contracts`: shared Zod API contracts.
- `packages/database`: Drizzle schema and database client.
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

Atlas account creation, workspace onboarding, direct workspace routing, and
the shared Atlas context are established.
