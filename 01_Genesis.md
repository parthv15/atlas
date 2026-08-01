# Genesis

## Vision

Genesis is a workspace-oriented application prototype with a relational system
of record and room for later AI-powered exploration.

The user-facing application is **Atlas**. The two Phase 1 services are:

- `atlas-web`: the Next.js application for authentication, Atlas accounts,
  workspace onboarding, and workspace views.
- `atlas-indexer`: an independently deployable Fastify service for future
  backend capabilities.

## Goals

- Learn modern backend architecture.
- Learn authentication, tenancy, and service boundaries.
- Keep PostgreSQL-compatible SQL as the system of record.
- Add Neo4j and AI only after the core ingestion pipeline is complete.

## Phase 1 (Genesis)

- Authentication
- Atlas account creation
- Workspace onboarding
- Workspace membership and roles
- Workspace-scoped server and client context

## Delivery Milestones

1. Scaffold the pnpm monorepo and shared packages.
2. Scaffold `atlas-web`.
3. Scaffold `atlas-indexer`.
4. Create Atlas accounts, workspaces, and memberships.
5. Add workspace onboarding and direct slug routing.
6. Add a workspace-scoped Atlas context.

## Non-goals

- AI features
- Neo4j
- Embeddings
- LLMs
