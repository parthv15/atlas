import { z } from "zod";

export const healthResponseSchema = z.object({
  service: z.literal("atlas-indexer"),
  status: z.literal("ok"),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const completeInstallationRequestSchema = z.object({
  installationId: z.number().int().positive(),
  atlasAccountId: z.string().min(1),
});

export type CompleteInstallationRequest = z.infer<
  typeof completeInstallationRequestSchema
>;
