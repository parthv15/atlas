# Technical Agreements

## Stack

- pnpm workspaces
- Next.js
- Better Auth
- Fastify
- Inngest
- Drizzle ORM
- Neon (PostgreSQL-compatible)
- TypeScript
- Zod

## Architecture

- GitHub never calls Next.js for webhook delivery.
- GitHub calls `atlas-indexer` directly.
- The GitHub App setup URL returns the user's browser to `atlas-web`.
- `atlas-web` sends authenticated commands to `atlas-indexer`.
- `atlas-web` fetches indexed data from `atlas-indexer`, preferably
  server-to-server.
- `atlas-indexer` owns GitHub credentials, indexing, and background processing.
- SQL is the source of truth.
- Neo4j will be a projection in a later phase.

## GitHub Installation Rules

- Never trust an `installation_id` solely because it appears in a setup URL.
- Verify the installation with GitHub before associating it with an Atlas
  account.
- Keep the GitHub App private key and installation tokens in `atlas-indexer`.
- Persist installation ownership before starting the initial sync.
- Treat repository selection updates as installation changes that require
  reconciliation.

## Webhook Rules

- Verify GitHub signatures against the unmodified request body.
- Record the GitHub delivery ID and reject duplicate processing.
- Return quickly after durable acceptance.
- Process work asynchronously.
- Make handlers idempotent.
- Track retries and failures.

## API Rules

- The browser does not receive worker service credentials.
- `atlas-web` does not access GitHub directly.
- `atlas-web` does not write indexing data directly.
- `atlas-indexer` exposes versioned REST endpoints.
- Requests and responses use shared Zod contracts.

## Design Principles

- Shared business logic belongs in `packages/`.
- Infrastructure should be replaceable.
- Keep domain logic independent of frameworks.
- Prefer composition over tight coupling.
