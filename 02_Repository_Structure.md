# Repository Structure

```text
atlas/
├── apps/
│   ├── atlas-web/       # Next.js + Better Auth
│   └── atlas-indexer/   # Fastify + Inngest
├── packages/
│   ├── database/        # Drizzle schema and database client
│   ├── github/          # GitHub App client and domain integration
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
- Dashboard
- GitHub App installation and setup flow
- Server-side calls to the indexer API
- Manual re-sync controls

### apps/atlas-indexer

- GitHub webhook endpoint
- Signature verification
- GitHub installation verification
- Inngest workflows
- GitHub API integration
- Writes to SQL
- Versioned indexed-data API

## Communication

```text
Browser -> Atlas Web
Atlas Web -> Atlas Indexer
GitHub -> Atlas Indexer
Atlas Indexer -> GitHub
Atlas Indexer -> SQL
Atlas Indexer -> Inngest
```

GitHub webhook traffic is never forwarded through `atlas-web`. After GitHub
redirects a user to the setup URL, `atlas-web` sends an authenticated
installation-completion command to `atlas-indexer`.
