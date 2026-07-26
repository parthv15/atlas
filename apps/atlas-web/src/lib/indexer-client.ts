import "server-only";

import { readWebEnvironment } from "@atlas/config";
import {
  type CompleteInstallationResponse,
  completeInstallationResponseSchema,
  type ErrorCode,
  errorResponseSchema,
  healthResponseSchema,
  type ListRepositoriesResponse,
  listRepositoriesResponseSchema,
} from "@atlas/contracts";

const REQUEST_TIMEOUT_MS = 5_000;

function indexerUrl(path: string): string {
  const base = readWebEnvironment().ATLAS_INDEXER_URL.replace(/\/$/, "");

  return `${base}${path}`;
}

export interface IndexerHealth {
  connected: boolean;
  label: string;
}

export async function getIndexerHealth(): Promise<IndexerHealth> {
  try {
    const response = await fetch(indexerUrl("/v1/health"), {
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });

    if (!response.ok) {
      return { connected: false, label: `HTTP ${response.status}` };
    }

    const health = healthResponseSchema.parse(await response.json());

    return { connected: true, label: health.status };
  } catch {
    return { connected: false, label: "unavailable" };
  }
}

/**
 * Indexer error codes, plus the one failure the Indexer cannot report about
 * itself. Collapsing that into `github_unavailable` would misattribute an
 * Atlas outage to GitHub.
 */
export type InstallationFailureCode = ErrorCode | "indexer_unavailable";

export type CompleteInstallationResult =
  | { ok: true; data: CompleteInstallationResponse }
  | { ok: false; code: InstallationFailureCode };

/**
 * Hands a GitHub installation to Atlas Indexer for verification.
 *
 * The service token is read here and never leaves the server. This function is
 * a courier: it does not decide whether the installation is legitimate, which
 * is entirely the Indexer's job.
 */
export async function completeInstallation(input: {
  installationId: number;
  atlasAccountId: string;
}): Promise<CompleteInstallationResult> {
  let response: Response;

  try {
    response = await fetch(indexerUrl("/v1/installations/complete"), {
      method: "POST",
      cache: "no-store",
      headers: {
        authorization: `Bearer ${readWebEnvironment().ATLAS_SERVICE_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, code: "indexer_unavailable" };
  }

  const payload: unknown = await response.json().catch(() => null);

  if (response.ok) {
    const parsed = completeInstallationResponseSchema.safeParse(payload);

    // A 200 that does not satisfy the contract means the two services disagree
    // about the API - an Atlas problem, not a GitHub one.
    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, code: "indexer_unavailable" };
  }

  const parsed = errorResponseSchema.safeParse(payload);

  return {
    ok: false,
    code: parsed.success ? parsed.data.error.code : "indexer_unavailable",
  };
}

export type ListRepositoriesResult =
  | { ok: true; data: ListRepositoriesResponse }
  | { ok: false; code: InstallationFailureCode };

/**
 * Lists the repositories a claimed installation can see.
 *
 * Exists mainly to give the web -> indexer -> GitHub path an end-to-end,
 * manually-triggerable route while the dashboard that will eventually call it
 * does not exist yet.
 */
export async function listRepositories(input: {
  installationId: number;
  atlasAccountId: string;
}): Promise<ListRepositoriesResult> {
  const url = new URL(
    indexerUrl(`/v1/installations/${input.installationId}/repositories`),
  );
  url.searchParams.set("atlasAccountId", input.atlasAccountId);

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        authorization: `Bearer ${readWebEnvironment().ATLAS_SERVICE_TOKEN}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, code: "indexer_unavailable" };
  }

  const payload: unknown = await response.json().catch(() => null);

  if (response.ok) {
    const parsed = listRepositoriesResponseSchema.safeParse(payload);

    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, code: "indexer_unavailable" };
  }

  const parsed = errorResponseSchema.safeParse(payload);

  return {
    ok: false,
    code: parsed.success ? parsed.data.error.code : "indexer_unavailable",
  };
}
