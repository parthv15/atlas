# Technical Agreements

## Stack

- pnpm workspaces
- Next.js
- Better Auth
- Fastify
- Drizzle ORM
- Neon (PostgreSQL-compatible)
- TypeScript
- Zod

## Architecture

- `atlas-web` owns authentication, Atlas accounts, workspaces, and memberships.
- Workspace routes resolve membership on the server before exposing Atlas
  context to client components.
- `atlas-web` communicates with `atlas-indexer` server-to-server.
- `atlas-indexer` remains independently deployable.
- SQL is the source of truth.
- Neo4j will be a projection in a later phase.

## API Rules

- The browser does not receive database credentials.
- `atlas-indexer` exposes versioned REST endpoints.
- Requests and responses use shared Zod contracts.

## Design Principles

- Shared business logic belongs in `packages/`.
- Infrastructure should be replaceable.
- Keep domain logic independent of frameworks.
- Prefer composition over tight coupling.
