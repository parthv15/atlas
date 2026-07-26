import Fastify, {
  type FastifyBaseLogger,
  type FastifyInstance,
} from "fastify";

import { type HealthResponse } from "@atlas/contracts";
import type { GitHubAppClient } from "@atlas/github";

import { registerInstallationRoutes } from "./installations/routes";
import type { InstallationStore } from "./installations/store";

export interface AppDependencies {
  githubClient: GitHubAppClient;
  installationStore: InstallationStore;
  serviceToken: string;
  /** A pino logger satisfies this. Omitted in tests to keep output quiet. */
  logger?: FastifyBaseLogger;
}

/**
 * Builds the Fastify instance from its collaborators.
 *
 * Dependencies are injected rather than constructed here so routes can be
 * exercised against fakes, with no database and no network.
 */
export function buildApp(dependencies: AppDependencies): FastifyInstance {
  const app = Fastify(
    dependencies.logger
      ? { loggerInstance: dependencies.logger }
      : { logger: false },
  );

  app.get<{ Reply: HealthResponse }>("/v1/health", async () => ({
    service: "atlas-indexer",
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  registerInstallationRoutes(app, {
    githubClient: dependencies.githubClient,
    installationStore: dependencies.installationStore,
    serviceToken: dependencies.serviceToken,
  });

  return app;
}
