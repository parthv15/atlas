import Fastify, {
  type FastifyBaseLogger,
  type FastifyInstance,
} from "fastify";

import { type HealthResponse } from "@atlas/contracts";

export interface AppDependencies {
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

  return app;
}
