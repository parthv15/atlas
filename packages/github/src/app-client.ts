import { App, Octokit } from "octokit";

import { GitHubUnavailableError } from "./errors";
import type {
  GitHubAppClient,
  GitHubAppConfig,
  GitHubInstallation,
  GitHubInstallationClient,
  GitHubRepository,
} from "./types";

/**
 * The API version is pinned so that a change to GitHub's default cannot
 * silently alter the response shapes this package maps from.
 */
const GITHUB_API_VERSION = "2022-11-28";

const DEFAULT_RETRIES = 2;

function statusOf(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const { status } = error as { status: unknown };
    return typeof status === "number" ? status : undefined;
  }

  return undefined;
}

interface InstallationAccount {
  id?: unknown;
  login?: unknown;
  type?: unknown;
}

interface InstallationPayload {
  id: number;
  account?: InstallationAccount | null;
  suspended_at?: string | null;
}

interface RepositoryPayload {
  id: number;
  name: string;
  full_name: string;
  owner?: { login?: unknown } | null;
  private: boolean;
  default_branch?: string | null;
}

function mapRepository(payload: RepositoryPayload): GitHubRepository {
  return {
    id: payload.id,
    name: payload.name,
    fullName: payload.full_name,
    owner: typeof payload.owner?.login === "string" ? payload.owner.login : "",
    private: payload.private,
    defaultBranch: payload.default_branch ?? null,
  };
}

function mapInstallation(payload: InstallationPayload): GitHubInstallation {
  const account = payload.account;

  if (
    !account ||
    typeof account.id !== "number" ||
    typeof account.login !== "string"
  ) {
    throw new GitHubUnavailableError(
      `GitHub returned an installation without a usable account (installation ${payload.id})`,
    );
  }

  return {
    installationId: payload.id,
    accountId: account.id,
    accountLogin: account.login,
    accountType: account.type === "Organization" ? "Organization" : "User",
    suspendedAt: payload.suspended_at ? new Date(payload.suspended_at) : null,
  };
}

/**
 * Creates the Atlas GitHub App client.
 *
 * This function is the only place in Atlas that touches GitHub credentials.
 * The underlying auth strategy signs and rotates the App JWT, and mints,
 * caches, and refreshes per-installation access tokens. Callers choose a
 * client, never a credential.
 */
export function createGitHubAppClient(
  config: GitHubAppConfig,
): GitHubAppClient {
  // A plugin rather than constructor options: Octokit's constructor builds its
  // own header set and ignores a `headers` option, and a plugin applies to
  // every instance the App creates, including per-installation ones.
  const AtlasOctokit = Octokit.plugin((octokit) => {
    octokit.hook.before("request", (options) => {
      options.headers.accept = "application/vnd.github+json";
      options.headers["x-github-api-version"] = GITHUB_API_VERSION;
    });
  }).defaults({
    userAgent: "atlas-indexer",
    retry: { retries: config.retries ?? DEFAULT_RETRIES },
    ...(config.fetch ? { request: { fetch: config.fetch } } : {}),
  });

  const app = new App({
    appId: config.appId,
    privateKey: config.privateKey,
    Octokit: AtlasOctokit,
  });

  return {
    async getInstallation(
      installationId: number,
    ): Promise<GitHubInstallation | null> {
      try {
        const response = await app.octokit.request(
          "GET /app/installations/{installation_id}",
          { installation_id: installationId },
        );

        return mapInstallation(response.data as InstallationPayload);
      } catch (error) {
        if (error instanceof GitHubUnavailableError) {
          throw error;
        }

        const status = statusOf(error);

        if (status === 404) {
          return null;
        }

        throw new GitHubUnavailableError(
          `Failed to read GitHub installation ${installationId}`,
          { cause: error, status },
        );
      }
    },

    async forInstallation(
      installationId: number,
    ): Promise<GitHubInstallationClient> {
      let octokit;

      try {
        octokit = await app.getInstallationOctokit(installationId);
      } catch (error) {
        throw new GitHubUnavailableError(
          `Failed to authenticate as GitHub installation ${installationId}`,
          { cause: error, status: statusOf(error) },
        );
      }

      return {
        installationId,
        async request<TData = unknown>(
          route: string,
          parameters: Record<string, unknown> = {},
        ) {
          const response = await octokit.request(route, parameters);

          return {
            status: response.status,
            data: response.data as TData,
          };
        },
        async listRepositories() {
          try {
            // The endpoint wraps its array in { total_count, repositories },
            // so paginate needs a mapper to reach into it on every page.
            const repositories = await octokit.paginate(
              "GET /installation/repositories",
              { per_page: 100 },
              (response) =>
                (response.data as { repositories: RepositoryPayload[] })
                  .repositories,
            );

            return repositories.map(mapRepository);
          } catch (error) {
            throw new GitHubUnavailableError(
              `Failed to list repositories for installation ${installationId}`,
              { cause: error, status: statusOf(error) },
            );
          }
        },
      };
    },
  };
}
