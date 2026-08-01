# Repository Structure

```text
atlas/
├── apps/
│   ├── atlas-web/       # Next.js + Better Auth
│   └── atlas-indexer/   # Fastify service
├── packages/
│   ├── database/        # Drizzle schema and database client
│   ├── contracts/       # Shared Zod API contracts
│   ├── logging/         # Shared structured logging
│   └── config/          # Shared configuration helpers
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Responsibilities

### apps/atlas-web

- User authentication
- Atlas account and workspace onboarding
- Workspace-scoped application context
- Server-side calls to the indexer API

### apps/atlas-indexer

- Versioned health API
- Future background services

## Communication

```text
Browser -> Atlas Web
Atlas Web -> Atlas Indexer
```
