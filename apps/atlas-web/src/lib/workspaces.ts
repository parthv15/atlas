import "server-only";

import {
  atlasAccounts,
  workspaceMembers,
  workspaces,
} from "@atlas/database";
import { and, asc, eq } from "drizzle-orm";

import { database } from "./database";

export const RESERVED_WORKSPACE_SLUGS = new Set([
  "api",
  "auth",
  "login",
  "logout",
  "new",
  "onboarding",
  "setup",
  "sign-in",
  "sign-up",
]);

export function workspaceSlugFromName(name: string): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function getFirstWorkspaceForAuthUser(authUserId: string) {
  const [result] = await database
    .select({ slug: workspaces.slug })
    .from(atlasAccounts)
    .innerJoin(
      workspaceMembers,
      eq(workspaceMembers.atlasAccountId, atlasAccounts.id),
    )
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(atlasAccounts.authUserId, authUserId))
    .orderBy(asc(workspaceMembers.createdAt))
    .limit(1);

  return result ?? null;
}

export async function getWorkspaceForAuthUser(
  authUserId: string,
  workspaceSlug: string,
) {
  const [result] = await database
    .select({
      account: {
        id: atlasAccounts.id,
        name: atlasAccounts.name,
        email: atlasAccounts.email,
        avatarUrl: atlasAccounts.avatarUrl,
        createdAt: atlasAccounts.createdAt,
      },
      membership: {
        role: workspaceMembers.role,
        createdAt: workspaceMembers.createdAt,
      },
      workspace: {
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        createdAt: workspaces.createdAt,
      },
    })
    .from(atlasAccounts)
    .innerJoin(
      workspaceMembers,
      eq(workspaceMembers.atlasAccountId, atlasAccounts.id),
    )
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(atlasAccounts.authUserId, authUserId),
        eq(workspaces.slug, workspaceSlug),
      ),
    )
    .limit(1);

  return result ?? null;
}
