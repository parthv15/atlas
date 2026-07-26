import {
  completeInstallationRequestSchema,
  type CompleteInstallationResponse,
  type ErrorCode,
  type ErrorResponse,
  type ListRepositoriesResponse,
  listRepositoriesQuerySchema,
} from "@atlas/contracts";
import { type GitHubAppClient, GitHubUnavailableError } from "@atlas/github";
import type { FastifyInstance, FastifyReply } from "fastify";

import { createServiceAuthHook } from "../plugins/service-auth";
import type { InstallationStore, StoredInstallation } from "./store";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  unauthorized: 401,
  invalid_request: 400,
  installation_not_found: 404,
  installation_not_owned: 403,
  installation_conflict: 409,
  github_unavailable: 502,
};

function fail(reply: FastifyReply, code: ErrorCode, message: string) {
  const body: ErrorResponse = { error: { code, message } };

  return reply.code(STATUS_BY_CODE[code]).send(body);
}

function serialise(
  installation: StoredInstallation,
): CompleteInstallationResponse["installation"] {
  return {
    id: installation.id,
    githubInstallationId: installation.githubInstallationId,
    atlasAccountId: installation.atlasAccountId,
    githubAccountId: installation.githubAccountId,
    githubAccountLogin: installation.githubAccountLogin,
    githubAccountType: installation.githubAccountType,
    suspendedAt: installation.suspendedAt?.toISOString() ?? null,
    createdAt: installation.createdAt.toISOString(),
    updatedAt: installation.updatedAt.toISOString(),
  };
}

export interface InstallationRoutesOptions {
  githubClient: GitHubAppClient;
  installationStore: InstallationStore;
  serviceToken: string;
}

export function registerInstallationRoutes(
  app: FastifyInstance,
  options: InstallationRoutesOptions,
): void {
  const { githubClient, installationStore, serviceToken } = options;

  app.post(
    "/v1/installations/complete",
    { preHandler: createServiceAuthHook(serviceToken) },
    async (request, reply) => {
      const parsed = completeInstallationRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        return fail(
          reply,
          "invalid_request",
          "The installation completion request body is invalid.",
        );
      }

      const { installationId, atlasAccountId } = parsed.data;

      // The setup URL is attacker-reachable, so the installation is only ever
      // described by GitHub itself - never by the request that reported it.
      let installation;

      try {
        installation = await githubClient.getInstallation(installationId);
      } catch (error) {
        if (error instanceof GitHubUnavailableError) {
          request.log.error(
            { err: error, installationId },
            "GitHub installation lookup failed",
          );

          return fail(
            reply,
            "github_unavailable",
            "GitHub could not be reached to verify this installation.",
          );
        }

        throw error;
      }

      if (!installation) {
        return fail(
          reply,
          "installation_not_found",
          "GitHub does not recognise this installation.",
        );
      }

      // For a personal installation the installing account must be the same
      // GitHub identity the Atlas user signed in with. Organization installs
      // cannot be checked this way - proving org admin rights needs a
      // user-to-server token - so they rely on the callback state nonce and
      // first-claim ownership until webhook reconciliation lands.
      if (installation.accountType === "User") {
        const linkedGithubAccountId =
          await installationStore.findLinkedGithubAccountId(atlasAccountId);

        if (linkedGithubAccountId !== String(installation.accountId)) {
          request.log.warn(
            { atlasAccountId, installationId },
            "Rejected an installation belonging to a different GitHub user",
          );

          return fail(
            reply,
            "installation_not_owned",
            "This installation belongs to a different GitHub account.",
          );
        }
      }

      const claim = await installationStore.claimInstallation({
        githubInstallationId: installation.installationId,
        atlasAccountId,
        githubAccountId: installation.accountId,
        githubAccountLogin: installation.accountLogin,
        githubAccountType: installation.accountType,
        suspendedAt: installation.suspendedAt,
      });

      if (!claim) {
        return fail(
          reply,
          "installation_conflict",
          "This installation is already connected to another Atlas account.",
        );
      }

      const body: CompleteInstallationResponse = {
        installation: serialise(claim.installation),
        created: claim.created,
      };

      return reply.code(200).send(body);
    },
  );

  // A quick way to exercise web -> indexer -> GitHub end to end: list the
  // repositories an already-claimed installation can see.
  app.get(
    "/v1/installations/:installationId/repositories",
    { preHandler: createServiceAuthHook(serviceToken) },
    async (request, reply) => {
      const rawInstallationId = (request.params as { installationId?: string })
        .installationId;
      const installationId = Number(rawInstallationId);

      if (!Number.isInteger(installationId) || installationId <= 0) {
        return fail(
          reply,
          "invalid_request",
          "The installation id in the URL is invalid.",
        );
      }

      const query = listRepositoriesQuerySchema.safeParse(request.query);

      if (!query.success) {
        return fail(reply, "invalid_request", "atlasAccountId is required.");
      }

      // Scoped to the caller's own installation, same as the completion
      // endpoint - an Atlas account cannot list another account's repos by
      // guessing an installation id.
      const owned = await installationStore.findOwnedInstallation(
        query.data.atlasAccountId,
        installationId,
      );

      if (!owned) {
        return fail(
          reply,
          "installation_not_found",
          "No installation with this id is connected to this Atlas account.",
        );
      }

      let repositories;

      try {
        const installationClient =
          await githubClient.forInstallation(installationId);
        repositories = await installationClient.listRepositories();
      } catch (error) {
        if (error instanceof GitHubUnavailableError) {
          request.log.error(
            { err: error, installationId },
            "Failed to list repositories for installation",
          );

          return fail(
            reply,
            "github_unavailable",
            "GitHub could not be reached to list repositories.",
          );
        }

        throw error;
      }

      const body: ListRepositoriesResponse = { repositories };

      return reply.code(200).send(body);
    },
  );
}
