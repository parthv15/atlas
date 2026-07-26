/**
 * A GitHub App installation, as Atlas models it.
 *
 * This is deliberately our own shape rather than Octokit's response type: the
 * HTTP client is an implementation detail of this package and must not leak
 * into the indexer's domain logic.
 */
export interface GitHubInstallation {
  installationId: number;
  accountId: number;
  accountLogin: string;
  accountType: "User" | "Organization";
  suspendedAt: Date | null;
}

/** A repository, as exposed to an installation - our own shape, not Octokit's. */
export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  defaultBranch: string | null;
}

/**
 * A client bound to a single installation.
 *
 * Every request it makes carries an installation access token that this
 * package mints, caches, and refreshes. Callers cannot obtain the token.
 */
export interface GitHubInstallationClient {
  readonly installationId: number;
  request<TData = unknown>(
    route: string,
    parameters?: Record<string, unknown>,
  ): Promise<{ status: number; data: TData }>;

  /** Every repository this installation was granted access to, all pages. */
  listRepositories(): Promise<GitHubRepository[]>;
}

export interface GitHubAppClient {
  /**
   * Looks up an installation using App credentials.
   *
   * Resolves to `null` when GitHub reports the installation does not exist or
   * does not belong to this App. Throws {@link GitHubUnavailableError} when
   * GitHub could not be reached or answered with anything else unexpected -
   * "GitHub says no" and "GitHub did not answer" must not be conflated.
   */
  getInstallation(installationId: number): Promise<GitHubInstallation | null>;

  /** Returns a client authenticated as the given installation. */
  forInstallation(installationId: number): Promise<GitHubInstallationClient>;
}

export interface GitHubAppConfig {
  appId: number;
  privateKey: string;
  /**
   * Retries for transient GitHub failures. Kept low by default: the
   * installation callback is synchronous and a user is waiting on it, so the
   * total retry budget has to stay inside the caller's request timeout.
   */
  retries?: number;
  /**
   * Overrides the fetch implementation. Used by tests to exercise the client
   * without network access.
   */
  fetch?: typeof globalThis.fetch;
}
