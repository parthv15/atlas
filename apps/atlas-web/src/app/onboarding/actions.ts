"use server";

import {
  atlasAccounts,
  workspaceMembers,
  workspaces,
} from "@atlas/database";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { database } from "@/lib/database";
import { getServerSession } from "@/lib/get-server-session";
import {
  getFirstWorkspaceForAuthUser,
  RESERVED_WORKSPACE_SLUGS,
  workspaceSlugFromName,
} from "@/lib/workspaces";

export interface OnboardingState {
  error?: string;
}

export async function completeOnboarding(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  const existingWorkspace = await getFirstWorkspaceForAuthUser(session.user.id);

  if (existingWorkspace) {
    redirect(`/${existingWorkspace.slug}`);
  }

  const workspaceName = String(formData.get("workspaceName") ?? "").trim();

  if (workspaceName.length < 2 || workspaceName.length > 80) {
    return { error: "Workspace name must be between 2 and 80 characters." };
  }

  const baseSlug = workspaceSlugFromName(workspaceName);

  if (!baseSlug) {
    return { error: "Choose a workspace name containing letters or numbers." };
  }

  let selectedSlug: string | null = null;

  for (let suffix = 1; suffix <= 20; suffix += 1) {
    const candidate = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;

    if (RESERVED_WORKSPACE_SLUGS.has(candidate)) {
      continue;
    }

    const [existing] = await database
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, candidate))
      .limit(1);

    if (!existing) {
      selectedSlug = candidate;
      break;
    }
  }

  if (!selectedSlug) {
    return { error: "That workspace name is unavailable. Try another one." };
  }

  const workspaceSlug = selectedSlug;

  const accountId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();

  try {
    await database.transaction(async (transaction) => {
      await transaction.insert(atlasAccounts).values({
        id: accountId,
        authUserId: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatarUrl: session.user.image ?? null,
      });

      await transaction.insert(workspaces).values({
        id: workspaceId,
        name: workspaceName,
        slug: workspaceSlug,
        createdByAccountId: accountId,
      });

      await transaction.insert(workspaceMembers).values({
        workspaceId,
        atlasAccountId: accountId,
        role: "owner",
      });
    });
  } catch {
    const workspace = await getFirstWorkspaceForAuthUser(session.user.id);

    if (workspace) {
      redirect(`/${workspace.slug}`);
    }

    return { error: "Atlas could not create the workspace. Please try again." };
  }

  redirect(`/${workspaceSlug}`);
}
