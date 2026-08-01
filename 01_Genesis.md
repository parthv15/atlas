# Genesis

## Vision

Genesis is a knowledge platform that indexes GitHub data into a relational
database and later projects it into a graph for AI-powered exploration.

The user-facing application is **Atlas**. The two Phase 1 services are:

- `atlas-web`: the Next.js application for authentication, GitHub App
  installation, dashboard views, and indexing controls.
- `atlas-indexer`: the Fastify service that owns GitHub integration, ingestion,
  background processing, and indexed-data APIs.

## Goals

- Learn modern backend architecture.
- Build a production-quality GitHub App.
- Keep PostgreSQL-compatible SQL as the system of record.
- Add Neo4j and AI only after the core ingestion pipeline is complete.

## Phase 1 (Genesis)

- GitHub App installation
- Initial repository sync
- GitHub webhook ingestion
- Store metadata in SQL
- Dashboard for indexed data
- Manual re-sync

## Delivery Milestones

1. Scaffold the pnpm monorepo and shared packages.
2. Scaffold `atlas-web`.
3. Scaffold `atlas-indexer`.
4. Implement the authenticated Atlas-to-GitHub App installation flow.
5. Verify and persist installations in `atlas-indexer`, then queue initial sync.
6. Receive, verify, record, and asynchronously process GitHub webhooks.
7. Expose indexed data through a versioned API consumed by `atlas-web`.

## Non-goals

- AI features
- Neo4j
- Embeddings
- LLMs
