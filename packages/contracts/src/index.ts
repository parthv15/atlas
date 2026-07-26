import { z } from "zod";

export const healthResponseSchema = z.object({
  service: z.literal("atlas-indexer"),
  status: z.literal("ok"),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

/**
 * The caller sends only the installation it saw and the Atlas account that saw
 * it. Everything else about the installation is resolved by Atlas Indexer from
 * GitHub, because a browser callback is not evidence.
 */
export const completeInstallationRequestSchema = z.object({
  installationId: z.number().int().positive(),
  atlasAccountId: z.string().min(1),
});

export type CompleteInstallationRequest = z.infer<
  typeof completeInstallationRequestSchema
>;

export const installationSchema = z.object({
  id: z.number().int().positive(),
  githubInstallationId: z.number().int().positive(),
  atlasAccountId: z.string().min(1),
  githubAccountId: z.number().int().positive(),
  githubAccountLogin: z.string().min(1),
  githubAccountType: z.string().min(1),
  suspendedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Installation = z.infer<typeof installationSchema>;

export const completeInstallationResponseSchema = z.object({
  installation: installationSchema,
  /** False when this callback re-confirmed an installation Atlas already held. */
  created: z.boolean(),
});

export type CompleteInstallationResponse = z.infer<
  typeof completeInstallationResponseSchema
>;

export const repositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  fullName: z.string().min(1),
  owner: z.string().min(1),
  private: z.boolean(),
  defaultBranch: z.string().nullable(),
});

export type Repository = z.infer<typeof repositorySchema>;

export const listRepositoriesResponseSchema = z.object({
  repositories: z.array(repositorySchema),
});

export type ListRepositoriesResponse = z.infer<
  typeof listRepositoriesResponseSchema
>;

/** The caller identifies itself the same way it does to complete an installation. */
export const listRepositoriesQuerySchema = z.object({
  atlasAccountId: z.string().min(1),
});

export type ListRepositoriesQuery = z.infer<typeof listRepositoriesQuerySchema>;

export const errorCodeSchema = z.enum([
  "unauthorized",
  "invalid_request",
  "installation_not_found",
  "installation_not_owned",
  "installation_conflict",
  "github_unavailable",
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string().min(1),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
