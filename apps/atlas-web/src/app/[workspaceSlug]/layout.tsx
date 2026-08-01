import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

import { AtlasContextProvider } from "@/components/atlas-context-provider";
import { getAtlasContext } from "@/lib/atlas-context";
import { getServerSession } from "@/lib/get-server-session";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  const { workspaceSlug } = await params;
  const context = await getAtlasContext(workspaceSlug);

  if (!context) {
    notFound();
  }

  return (
    <AtlasContextProvider value={context}>{children}</AtlasContextProvider>
  );
}
