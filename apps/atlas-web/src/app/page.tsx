import { redirect } from "next/navigation";

import { AuthControls } from "../components/auth-controls";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { getServerSession } from "../lib/get-server-session";
import { getIndexerHealth } from "../lib/indexer-client";
import { getFirstWorkspaceForAuthUser } from "../lib/workspaces";

export default async function Home() {
  const [indexer, session] = await Promise.all([
    getIndexerHealth(),
    getServerSession(),
  ]);

  if (session) {
    const workspace = await getFirstWorkspaceForAuthUser(session.user.id);

    redirect(workspace ? `/${workspace.slug}` : "/onboarding");
  }

  return (
    <main className="relative min-h-svh overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, oklch(from var(--primary) l c h / 15%) 0, transparent 32rem)",
        }}
      />
      <div className="relative mx-auto w-full max-w-5xl px-6 py-12 sm:py-24">
        <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Atlas · Genesis
          </div>
          <AuthControls />
        </header>

        <section className="py-16 sm:py-24">
          <h1 className="max-w-3xl text-5xl leading-[0.95] font-semibold tracking-[-0.055em] sm:text-7xl">
            Repository context starts here.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Sign in to create your Atlas account and workspace.
          </p>
        </section>

        <div className="grid gap-4">
          <Card
            className="bg-card/75 backdrop-blur"
            aria-label="Indexer connection status"
          >
            <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Atlas Indexer</CardTitle>
                <CardDescription className="mt-1">
                  Server-to-server health check
                </CardDescription>
              </div>
              <div
                className={
                  indexer.connected
                    ? "font-semibold text-success"
                    : "font-semibold text-destructive"
                }
              >
                {indexer.label}
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The web and indexing services remain independently deployable.
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
