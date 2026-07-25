import { z } from "zod";

const databaseEnvironmentSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection URL",
    ),
});

const indexerEnvironmentSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const webEnvironmentSchema = databaseEnvironmentSchema.extend({
  ATLAS_INDEXER_URL: z.url().default("http://localhost:4000"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must contain at least 32 characters"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
});

export type DatabaseEnvironment = z.infer<typeof databaseEnvironmentSchema>;
export type IndexerEnvironment = z.infer<typeof indexerEnvironmentSchema>;
export type WebEnvironment = z.infer<typeof webEnvironmentSchema>;

export function readDatabaseEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseEnvironment {
  return databaseEnvironmentSchema.parse(environment);
}

export function readIndexerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): IndexerEnvironment {
  return indexerEnvironmentSchema.parse(environment);
}

export function readWebEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): WebEnvironment {
  return webEnvironmentSchema.parse(environment);
}
