import "server-only";

import { cache } from "react";

import { getServerSession } from "./get-server-session";
import type { AtlasContextValue } from "./atlas-context-types";
import { getWorkspaceForAuthUser } from "./workspaces";

export const getAtlasContext = cache(
  async (workspaceSlug: string): Promise<AtlasContextValue | null> => {
    const session = await getServerSession();

    if (!session) {
      return null;
    }

    const result = await getWorkspaceForAuthUser(
      session.user.id,
      workspaceSlug,
    );

    if (!result) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      },
      account: {
        ...result.account,
        createdAt: result.account.createdAt.toISOString(),
      },
      workspace: {
        ...result.workspace,
        createdAt: result.workspace.createdAt.toISOString(),
      },
      membership: {
        ...result.membership,
        createdAt: result.membership.createdAt.toISOString(),
      },
    };
  },
);
