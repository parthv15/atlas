import { notFound } from "next/navigation";

import { AuthControls } from "@/components/auth-controls";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAtlasContext } from "@/lib/atlas-context";

export const dynamic = "force-dynamic";

function InformationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b py-4 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-6">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const context = await getAtlasContext(workspaceSlug);

  if (!context) {
    notFound();
  }

  return (
    <main className="min-h-svh px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-6 border-b pb-8 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] text-sky-300 uppercase">
              Atlas workspace
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {context.workspace.name}
            </h1>
          </div>
          <AuthControls />
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Workspace information</CardTitle>
              <CardDescription>
                The shared container for work in Atlas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl>
                <InformationRow label="Workspace ID" value={context.workspace.id} />
                <InformationRow label="Name" value={context.workspace.name} />
                <InformationRow label="Slug" value={context.workspace.slug} />
                <InformationRow label="Your role" value={context.membership.role} />
                <InformationRow
                  label="Created"
                  value={new Date(context.workspace.createdAt).toLocaleString()}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signed-in account</CardTitle>
              <CardDescription>
                The Better Auth user behind the current session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl>
                <InformationRow label="Auth user ID" value={context.user.id} />
                <InformationRow label="Name" value={context.user.name} />
                <InformationRow label="Email" value={context.user.email} />
              </dl>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Atlas account</CardTitle>
              <CardDescription>
                Your stable identity inside Atlas, independent of sign-in
                provider.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl>
                <InformationRow label="Atlas account ID" value={context.account.id} />
                <InformationRow label="Name" value={context.account.name} />
                <InformationRow label="Email" value={context.account.email} />
                <InformationRow
                  label="Created"
                  value={new Date(context.account.createdAt).toLocaleString()}
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
