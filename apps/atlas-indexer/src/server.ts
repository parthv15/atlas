import { readIndexerEnvironment } from "@atlas/config";
import { createDatabase } from "@atlas/database";
import { createGitHubAppClient } from "@atlas/github";
import { createLogger } from "@atlas/logging";

import { buildApp } from "./app";
import { createInstallationStore } from "./installations/store";

const environment = readIndexerEnvironment();
const logger = createLogger(environment.LOG_LEVEL);
const { client, db } = createDatabase(environment.DATABASE_URL);

const app = buildApp({
  githubClient: createGitHubAppClient({
    appId: environment.GITHUB_APP_ID,
    privateKey: environment.GITHUB_PRIVATE_KEY,
  }),
  installationStore: createInstallationStore(db),
  serviceToken: environment.ATLAS_SERVICE_TOKEN,
  logger,
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down atlas-indexer");
  await app.close();
  await client.end();
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
