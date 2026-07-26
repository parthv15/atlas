import type { GitHubAppClient, GitHubInstallation } from "@atlas/github";
import { GitHubUnavailableError } from "@atlas/github";
import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../app";
import type {
  ClaimInstallationInput,
  InstallationStore,
  StoredInstallation,
} from "./store";

const SERVICE_TOKEN = "a".repeat(32);
const ATLAS_ACCOUNT_ID = "atlas-user-1";
const GITHUB_USER_ID = 999;
const INSTALLATION_ID = 42;

const PERSONAL_INSTALLATION: GitHubInstallation = {
  installationId: INSTALLATION_ID,
  accountId: GITHUB_USER_ID,
  accountLogin: "octocat",
  accountType: "User",
  suspendedAt: null,
};

/**
 * An in-memory stand-in for the Drizzle store, with the same claim semantics:
 * first writer owns the installation, the owner may refresh it, and anyone
 * else is refused.
 */
function createFakeStore(links: Record<string, string> = {}): InstallationStore {
  const rows = new Map<number, StoredInstallation>();
  let nextId = 1;

  return {
    async findLinkedGithubAccountId(atlasAccountId) {
      return links[atlasAccountId] ?? null;
    },

    async claimInstallation(input: ClaimInstallationInput) {
      const existing = rows.get(input.githubInstallationId);

      if (!existing) {
        const now = new Date();
        const created: StoredInstallation = {
          id: nextId++,
          githubInstallationId: input.githubInstallationId,
          atlasAccountId: input.atlasAccountId,
          githubAccountId: input.githubAccountId,
          githubAccountLogin: input.githubAccountLogin,
          githubAccountType: input.githubAccountType,
          suspendedAt: input.suspendedAt,
          createdAt: now,
          updatedAt: now,
        };

        rows.set(input.githubInstallationId, created);

        return { installation: created, created: true };
      }

      if (existing.atlasAccountId !== input.atlasAccountId) {
        return null;
      }

      const updated: StoredInstallation = {
        ...existing,
        githubAccountId: input.githubAccountId,
        githubAccountLogin: input.githubAccountLogin,
        githubAccountType: input.githubAccountType,
        suspendedAt: input.suspendedAt,
        updatedAt: new Date(existing.updatedAt.getTime() + 1_000),
      };

      rows.set(input.githubInstallationId, updated);

      return { installation: updated, created: false };
    },

    async findOwnedInstallation(atlasAccountId, githubInstallationId) {
      const row = rows.get(githubInstallationId);

      return row && row.atlasAccountId === atlasAccountId ? row : null;
    },
  };
}

function createFakeGitHub(
  result: GitHubInstallation | null | Error,
): GitHubAppClient {
  return {
    async getInstallation() {
      if (result instanceof Error) {
        throw result;
      }

      return result;
    },
    forInstallation() {
      throw new Error("not used in these tests");
    },
  };
}

function complete(
  app: FastifyInstance,
  options: {
    token?: string | null;
    payload?: object;
  } = {},
) {
  const token = options.token === undefined ? SERVICE_TOKEN : options.token;

  return app.inject({
    method: "POST",
    url: "/v1/installations/complete",
    headers: token === null ? {} : { authorization: `Bearer ${token}` },
    payload:
      options.payload === undefined
        ? { installationId: INSTALLATION_ID, atlasAccountId: ATLAS_ACCOUNT_ID }
        : options.payload,
  });
}

describe("POST /v1/installations/complete", () => {
  let store: InstallationStore;

  beforeEach(() => {
    store = createFakeStore({ [ATLAS_ACCOUNT_ID]: String(GITHUB_USER_ID) });
  });

  function app(
    githubResult: GitHubInstallation | null | Error = PERSONAL_INSTALLATION,
  ) {
    return buildApp({
      githubClient: createFakeGitHub(githubResult),
      installationStore: store,
      serviceToken: SERVICE_TOKEN,
    });
  }

  it("rejects a request with no service token", async () => {
    const response = await complete(app(), { token: null });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("unauthorized");
  });

  it("rejects a request with the wrong service token", async () => {
    const response = await complete(app(), { token: "b".repeat(32) });

    expect(response.statusCode).toBe(401);
  });

  it("rejects a malformed body", async () => {
    const response = await complete(app(), {
      payload: { installationId: "not-a-number" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("invalid_request");
  });

  it("reports an installation GitHub does not recognise", async () => {
    const response = await complete(app(null));

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("installation_not_found");
  });

  it("does not treat a GitHub outage as a missing installation", async () => {
    const response = await complete(
      app(new GitHubUnavailableError("upstream exploded")),
    );

    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe("github_unavailable");
  });

  it("refuses a personal installation owned by a different GitHub user", async () => {
    const response = await complete(
      app({ ...PERSONAL_INSTALLATION, accountId: 12345 }),
    );

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("installation_not_owned");
  });

  it("refuses a personal installation when the Atlas account has no GitHub link", async () => {
    store = createFakeStore();

    const response = await complete(app());

    expect(response.statusCode).toBe(403);
  });

  it("persists a verified installation", async () => {
    const response = await complete(app());

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      created: true,
      installation: {
        githubInstallationId: INSTALLATION_ID,
        atlasAccountId: ATLAS_ACCOUNT_ID,
        githubAccountId: GITHUB_USER_ID,
        githubAccountLogin: "octocat",
        githubAccountType: "User",
        suspendedAt: null,
      },
    });
  });

  it("reports a suspended installation rather than hiding the suspension", async () => {
    const suspendedAt = new Date("2026-03-04T05:06:07.000Z");
    const response = await complete(
      app({ ...PERSONAL_INSTALLATION, suspendedAt }),
    );

    expect(response.statusCode).toBe(200);
    expect(response.json().installation.suspendedAt).toBe(
      suspendedAt.toISOString(),
    );
  });

  it("skips the ownership check for organisation installations", async () => {
    store = createFakeStore();

    const response = await complete(
      app({
        ...PERSONAL_INSTALLATION,
        accountType: "Organization",
        accountLogin: "acme",
      }),
    );

    expect(response.statusCode).toBe(200);
    expect(response.json().installation.githubAccountType).toBe("Organization");
  });

  it("is idempotent when the same account repeats the callback", async () => {
    const first = await complete(app());
    const second = await complete(
      app({ ...PERSONAL_INSTALLATION, accountLogin: "octocat-renamed" }),
    );

    expect(first.json().created).toBe(true);
    expect(second.json().created).toBe(false);
    expect(second.json().installation.id).toBe(first.json().installation.id);
    expect(second.json().installation.githubAccountLogin).toBe(
      "octocat-renamed",
    );
  });

  it("refuses an installation already claimed by another Atlas account", async () => {
    // An organisation installation, because that is the only case that can
    // actually reach the conflict check: a personal installation belonging to
    // someone else is stopped earlier by the ownership check.
    const organisation = {
      ...PERSONAL_INSTALLATION,
      accountType: "Organization" as const,
      accountLogin: "acme",
    };

    await complete(app(organisation));

    const response = await complete(app(organisation), {
      payload: {
        installationId: INSTALLATION_ID,
        atlasAccountId: "atlas-user-2",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("installation_conflict");
  });
});

describe("GET /v1/health", () => {
  it("stays reachable without a service token", async () => {
    const response = await buildApp({
      githubClient: createFakeGitHub(null),
      installationStore: createFakeStore(),
      serviceToken: SERVICE_TOKEN,
    }).inject({ method: "GET", url: "/v1/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("ok");
  });
});
