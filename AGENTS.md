# Atlas Agent Instructions

## No automated testing

Do not create, modify, run, recommend, or plan automated tests in this
repository. This includes unit, integration, end-to-end, browser, contract,
snapshot, and smoke-test suites.

Do not add test files, testing frameworks, test scripts, fixtures, mocks, or
testing dependencies. Do not spend implementation time or tokens proposing
test coverage.

When verification is appropriate, use only non-test checks such as:

- TypeScript typechecking
- linting
- production builds
- focused manual inspection or manual application checks

Existing test-related code may be removed when it is in scope, but must not be
run or expanded.

This is a repository-level product decision. It applies to all tasks and all
agents unless the user explicitly reverses it in a later request.

## Design standards

Before writing or changing any UI in `apps/atlas-web`, read
[04_Design_Standards.md](04_Design_Standards.md) and follow it. It defines
the color tokens, typography, and component patterns for the app, backed by
the Tailwind/shadcn tokens in `apps/atlas-web/src/app/globals.css`. Use the
existing Tailwind utility tokens (`bg-background`, `text-muted-foreground`,
etc.) rather than hardcoded colors, and do not introduce colors, fonts, or
radii outside that system without updating the standard first.
