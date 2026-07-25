import { readIndexerEnvironment } from "@atlas/config";
import { createLogger } from "@atlas/logging";

import { buildApp } from "./app";

const environment = readIndexerEnvironment();
const logger = createLogger(environment.LOG_LEVEL);
const app = buildApp();

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down atlas-indexer");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({
    host: environment.HOST,
    port: environment.PORT,
  });
  
  logger.info(
    { host: environment.HOST, port: environment.PORT },
    "atlas-indexer is listening",
  );
} catch (error) {
  logger.fatal({ error }, "Failed to start atlas-indexer");
  process.exit(1);
}
