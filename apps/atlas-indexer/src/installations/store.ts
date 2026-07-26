import { account, type Database, githubInstallations } from "@atlas/database";
import { and, eq } from "drizzle-orm";

export interface StoredInstallation {
  id: number;
  githubInstallationId: number;
  atlasAccountId: string;
  githubAccountId: number;
  githubAccountLogin: string;
  githubAccountType: string;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimInstallationInput {
  githubInstallationId: number;
  atlasAccountId: string;
  githubAccountId: number;
  githubAccountLogin: string;
  githubAccountType: string;
  suspendedAt: Date | null;
}

export interface ClaimInstallationResult {
  installation: StoredInstallation;
  created: boolean;
}

export interface InstallationStore {
  /**
   * The GitHub user id linked to an Atlas account by GitHub OAuth sign-in, or
   * `null` when the account has no linked GitHub identity.
   */
  findLinkedGithubAccountId(atlasAccountId: string): Promise<string | null>;

  /**
   * Records the installation against the Atlas account.
   *
   * Resolves to `null` when the installation is already held by a *different*
   * Atlas account, which the caller reports as a conflict.
   */
  claimInstallation(
    input: ClaimInstallationInput,
  ): Promise<ClaimInstallationResult | null>;

  /**
   * Looks up an installation, scoped to the Atlas account that must own it.
   *
   * Resolves to `null` both when the installation does not exist and when it
   * belongs to someone else - the two are indistinguishable to the caller by
   * design, so this can't be used to probe for other accounts' installations.
   */
  findOwnedInstallation(
    atlasAccountId: string,
    githubInstallationId: number,
  ): Promise<StoredInstallation | null>;
}

export function createInstallationStore(db: Database): InstallationStore {
  return {
    async findLinkedGithubAccountId(atlasAccountId) {
      const [row] = await db
        .select({ accountId: account.accountId })
        .from(account)
        .where(
          and(
            eq(account.userId, atlasAccountId),
            eq(account.providerId, "github"),
          ),
        )
        .limit(1);

      return row?.accountId ?? null;
    },

    async claimInstallation(input) {
      // Two atomic statements rather than a single upsert with a conditional
      // SET: the insert tells us unambiguously whether this is a first claim,
      // and the ownership-scoped update distinguishes "we already had this"
      // from "someone else has this" without a read-modify-write race.
      const [inserted] = await db
        .insert(githubInstallations)
        .values({
          githubInstallationId: input.githubInstallationId,
          atlasAccountId: input.atlasAccountId,
          githubAccountId: input.githubAccountId,
          githubAccountLogin: input.githubAccountLogin,
          githubAccountType: input.githubAccountType,
          suspendedAt: input.suspendedAt,
        })
        .onConflictDoNothing({
          target: githubInstallations.githubInstallationId,
        })
        .returning();

      if (inserted) {
        return { installation: inserted, created: true };
      }

      const [updated] = await db
        .update(githubInstallations)
        .set({
          githubAccountId: input.githubAccountId,
          githubAccountLogin: input.githubAccountLogin,
          githubAccountType: input.githubAccountType,
          suspendedAt: input.suspendedAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              githubInstallations.githubInstallationId,
              input.githubInstallationId,
            ),
            eq(githubInstallations.atlasAccountId, input.atlasAccountId),
          ),
        )
        .returning();

      return updated ? { installation: updated, created: false } : null;
    },

    async findOwnedInstallation(atlasAccountId, githubInstallationId) {
      const [row] = await db
        .select()
        .from(githubInstallations)
        .where(
          and(
            eq(githubInstallations.githubInstallationId, githubInstallationId),
            eq(githubInstallations.atlasAccountId, atlasAccountId),
          ),
        )
        .limit(1);

      return row ?? null;
    },
  };
}
