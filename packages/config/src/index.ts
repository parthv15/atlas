import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

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

const PEM_PREFIX = "-----BEGIN";

const WORKSPACE_MARKER = "pnpm-workspace.yaml";

/**
 * Locates the repository root by walking up from the working directory.
 *
 * Each app runs from its own directory, so a private key path written relative
 * to the repository root would otherwise mean something different depending on
 * which service read it.
 */
function findWorkspaceRoot(from: string = process.cwd()): string {
  let current = resolve(from);

  for (;;) {
    if (existsSync(resolve(current, WORKSPACE_MARKER))) {
      return current;
    }

    const parent = dirname(current);

    if (parent === current) {
      return resolve(from);
    }

    current = parent;
  }
}

/** Accepts a raw PEM or its single-line base64 encoding. */
function decodePrivateKey(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.startsWith(PEM_PREFIX)) {
    return trimmed;
  }

  const decoded = Buffer.from(trimmed, "base64").toString("utf8").trim();

  return decoded.startsWith(PEM_PREFIX) ? decoded : null;
}

function readPrivateKeyFile(path: string): string {
  const absolute = isAbsolute(path) ? path : resolve(findWorkspaceRoot(), path);

  if (!existsSync(absolute)) {
    throw new Error(
      `GITHUB_PRIVATE_KEY_PATH points at a file that does not exist: ${absolute}`,
    );
  }

  const contents = readFileSync(absolute, "utf8").trim();

  if (!contents.startsWith(PEM_PREFIX)) {
    throw new Error(`${absolute} is not a PEM private key`);
  }

  return contents;
}

const serviceTokenSchema = z
  .string()
  .min(32, "ATLAS_SERVICE_TOKEN must contain at least 32 characters");

const indexerEnvironmentSchema = databaseEnvironmentSchema
  .extend({
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    ATLAS_SERVICE_TOKEN: serviceTokenSchema,
    GITHUB_APP_ID: z.coerce.number().int().positive(),
    /** A path relative to the repository root, or an absolute one. */
    GITHUB_PRIVATE_KEY_PATH: z.string().min(1).optional(),
    /** A raw PEM or its base64 encoding. */
    GITHUB_PRIVATE_KEY: z.string().min(1).optional(),
  })
  // The key can arrive as a file on disk or as an environment value. Local
  // development gets the downloaded `.pem` straight from the repository root;
  // hosted deployments have no filesystem to put one on and use the value.
  .transform(({ GITHUB_PRIVATE_KEY_PATH, ...environment }, ctx) => {
    if (GITHUB_PRIVATE_KEY_PATH) {
      try {
        return {
          ...environment,
          GITHUB_PRIVATE_KEY: readPrivateKeyFile(GITHUB_PRIVATE_KEY_PATH),
        };
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          path: ["GITHUB_PRIVATE_KEY_PATH"],
          message: error instanceof Error ? error.message : String(error),
        });

        return z.NEVER;
      }
    }

    if (!environment.GITHUB_PRIVATE_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["GITHUB_PRIVATE_KEY"],
        message:
          "Set GITHUB_PRIVATE_KEY_PATH to the downloaded .pem, or GITHUB_PRIVATE_KEY to its contents",
      });

      return z.NEVER;
    }

    const decoded = decodePrivateKey(environment.GITHUB_PRIVATE_KEY);

    if (!decoded) {
      ctx.addIssue({
        code: "custom",
        path: ["GITHUB_PRIVATE_KEY"],
        message:
          "GITHUB_PRIVATE_KEY must be a PEM private key or its base64 encoding",
      });

      return z.NEVER;
    }

    return { ...environment, GITHUB_PRIVATE_KEY: decoded };
  });

const webEnvironmentSchema = databaseEnvironmentSchema.extend({
  ATLAS_INDEXER_URL: z.url().default("http://localhost:4000"),
  ATLAS_SERVICE_TOKEN: serviceTokenSchema,
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must contain at least 32 characters"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  GITHUB_APP_SLUG: z.string().min(1, "GITHUB_APP_SLUG is required"),
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
