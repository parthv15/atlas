import Fastify, { type FastifyInstance } from "fastify";

import { type HealthResponse } from "@atlas/contracts";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
  });

  app.get<{ Reply: HealthResponse }>("/v1/health", async () => ({
    service: "atlas-indexer",
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}
