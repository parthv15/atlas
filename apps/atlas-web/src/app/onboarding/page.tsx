import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerSession } from "@/lib/get-server-session";
import { getFirstWorkspaceForAuthUser } from "@/lib/workspaces";

import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/");
  }

  const workspace = await getFirstWorkspaceForAuthUser(session.user.id);

  if (workspace) {
    redirect(`/${workspace.slug}`);
  }

  return (
    <main className="grid min-h-svh place-items-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Atlas
          </div>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>
            Signed in as {session.user.email}. Your Atlas account and first
            workspace will be created together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </main>
  );
}
