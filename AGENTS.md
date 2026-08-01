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
