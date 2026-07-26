import { generateKeyPairSync } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { createGitHubAppClient } from "./app-client";
import { GitHubUnavailableError } from "./errors";

const APP_ID = 1234;
const INSTALLATION_ID = 42;

let privateKey: string;

beforeAll(() => {
  ({ privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  }));
});

interface RecordedRequest {
  url: string;
  method: string;
  headers: Headers;
}

interface StubbedResponse {
  status: number;
  body: unknown;
}

/**
 * A fetch stub that records every outbound call, so tests can assert on what
 * the client actually put on the wire rather than only on its return value.
 */
function stubFetch(routes: Record<string, StubbedResponse>) {
  const requests: RecordedRequest[] = [];

  const fetchImpl: typeof globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const key = `${method} ${new URL(url).pathname}`;

    requests.push({
      url,
      method,
      headers: new Headers(init?.headers),
    });

    const route = routes[key];

    if (!route) {
      throw new Error(`Unexpected request: ${key}`);
    }

    return new Response(JSON.stringify(route.body), {
      status: route.status,
      headers: { "content-type": "application/json" },
    });
  };

  return { fetchImpl, requests };
}

const INSTALLATION_PAYLOAD = {
  id: INSTALLATION_ID,
  account: { id: 999, login: "octocat", type: "User" },
  suspended_at: null,
};

const GET_INSTALLATION = `GET /app/installations/${INSTALLATION_ID}`;
const MINT_TOKEN = `POST /app/installations/${INSTALLATION_ID}/access_tokens`;

function createClient(
  routes: Record<string, StubbedResponse>,
  retries = 0,
) {
  const { fetchImpl, requests } = stubFetch(routes);

  const client = createGitHubAppClient({
    appId: APP_ID,
    privateKey,
    retries,
    fetch: fetchImpl,
  });

  return { client, requests };
}

describe("getInstallation", () => {
  it("maps GitHub's payload onto the Atlas installation shape", async () => {
    const { client } = createClient({
      [GET_INSTALLATION]: { status: 200, body: INSTALLATION_PAYLOAD },
    });

    await expect(client.getInstallation(INSTALLATION_ID)).resolves.toEqual({
      installationId: INSTALLATION_ID,
      accountId: 999,
      accountLogin: "octocat",
      accountType: "User",
      suspendedAt: null,
    });
  });

  it("converts a suspension timestamp to a Date", async () => {
    const { client } = createClient({
      [GET_INSTALLATION]: {
        status: 200,
        body: { ...INSTALLATION_PAYLOAD, suspended_at: "2026-01-02T03:04:05Z" },
      },
    });

    const installation = await client.getInstallation(INSTALLATION_ID);

    expect(installation?.suspendedAt).toEqual(new Date("2026-01-02T03:04:05Z"));
  });

  it("resolves to null when GitHub does not recognise the installation", async () => {
    const { client } = createClient({
      [GET_INSTALLATION]: { status: 404, body: { message: "Not Found" } },
    });

    await expect(client.getInstallation(INSTALLATION_ID)).resolves.toBeNull();
  });

  it("throws rather than reporting 'not found' when GitHub fails", async () => {
    const { client } = createClient({
      [GET_INSTALLATION]: { status: 500, body: { message: "Server Error" } },
    });

    await expect(client.getInstallation(INSTALLATION_ID)).rejects.toBeInstanceOf(
      GitHubUnavailableError,
    );
  });

  it("throws when the installation carries no usable account", async () => {
    const { client } = createClient({
      [GET_INSTALLATION]: {
        status: 200,
        body: { id: INSTALLATION_ID, account: null },
      },
    });

    await expect(client.getInstallation(INSTALLATION_ID)).rejects.toBeInstanceOf(
      GitHubUnavailableError,
    );
  });

  it("pins the API version and identifies Atlas on every request", async () => {
    const { client, requests } = createClient({
      [GET_INSTALLATION]: { status: 200, body: INSTALLATION_PAYLOAD },
    });

    await client.getInstallation(INSTALLATION_ID);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.headers.get("x-github-api-version")).toBe("2022-11-28");
    expect(requests[0]?.headers.get("accept")).toBe(
      "application/vnd.github+json",
    );
    expect(requests[0]?.headers.get("user-agent")).toContain("atlas-indexer");
  });

  it("authenticates as the App, not as an installation", async () => {
    const { client, requests } = createClient({
      [GET_INSTALLATION]: { status: 200, body: INSTALLATION_PAYLOAD },
    });

    await client.getInstallation(INSTALLATION_ID);

    // A JWT, which is what App-level auth looks like on the wire.
    expect(requests[0]?.headers.get("authorization")).toMatch(/^bearer ey/i);
  });
});

describe("forInstallation", () => {
  const tokenResponse = {
    status: 201,
    body: {
      token: "ghs_installationtoken",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      permissions: { metadata: "read" },
      repository_selection: "selected",
    },
  };

  it("mints an installation token and sends it, without exposing it", async () => {
    const { client, requests } = createClient({
      [MINT_TOKEN]: tokenResponse,
      "GET /installation/repositories": {
        status: 200,
        body: { total_count: 0, repositories: [] },
      },
    });

    const installation = await client.forInstallation(INSTALLATION_ID);
    await installation.request("GET /installation/repositories");

    const dataRequest = requests.find((entry) =>
      entry.url.endsWith("/installation/repositories"),
    );

    expect(installation.installationId).toBe(INSTALLATION_ID);
    expect(dataRequest?.headers.get("authorization")).toBe(
      "token ghs_installationtoken",
    );
    // The token is reachable only through the client, never returned.
    expect(Object.keys(installation)).toEqual(["installationId", "request"]);
  });

  it("reuses a cached token instead of minting one per call", async () => {
    const { client, requests } = createClient({
      [MINT_TOKEN]: tokenResponse,
      "GET /installation/repositories": {
        status: 200,
        body: { total_count: 0, repositories: [] },
      },
    });

    const first = await client.forInstallation(INSTALLATION_ID);
    await first.request("GET /installation/repositories");

    const second = await client.forInstallation(INSTALLATION_ID);
    await second.request("GET /installation/repositories");

    const mints = requests.filter((entry) =>
      entry.url.endsWith("/access_tokens"),
    );

    expect(mints).toHaveLength(1);
  });
});
