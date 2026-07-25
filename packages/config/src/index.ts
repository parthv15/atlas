import { z } from "zod";

const indexerEnvironmentSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type IndexerEnvironment = z.infer<typeof indexerEnvironmentSchema>;

export function readIndexerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): IndexerEnvironment {
  return indexerEnvironmentSchema.parse(environment);
}
