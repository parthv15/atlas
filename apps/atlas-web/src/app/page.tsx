import { AuthControls } from "../components/auth-controls";
import { InstallationBanner } from "../components/installation-banner";
import { RepositoryLookup } from "../components/repository-lookup";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { getServerSession } from "../lib/get-server-session";
import { getIndexerHealth } from "../lib/indexer-client";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [indexer, session, resolvedSearchParams] = await Promise.all([
    getIndexerHealth(),
    getServerSession(),
    searchParams,
  ]);

  return (
    <main className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,oklch(0.28_0.08_250)_0,transparent_32rem)]" />
      <div className="relative mx-auto w-full max-w-5xl px-6 py-12 sm:py-24">
        <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-sky-300 uppercase">
            Atlas · Genesis
          </div>
          <AuthControls />
        </header>

        <InstallationBanner searchParams={resolvedSearchParams} />

        <section className="py-16 sm:py-24">
          <h1 className="max-w-3xl text-5xl leading-[0.95] font-semibold tracking-[-0.055em] sm:text-7xl">
            Repository context starts here.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {session
              ? `Welcome back, ${session.user.name}. Atlas is ready to connect your GitHub repositories.`
              : "Sign in with GitHub to connect repositories, index their activity, and make engineering context easy to explore."}
          </p>
        </section>

        <div className="grid gap-4">
          {session ? (
            <Card
              className="bg-card/75 backdrop-blur"
              aria-label="GitHub App installation"
            >
              <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Connect GitHub repositories</CardTitle>
                  <CardDescription className="mt-1">
                    Install the Atlas GitHub App and choose what it can read
                  </CardDescription>
                </div>
                {/* A plain anchor, not Link: this target is a route handler
                    that sets a cookie and redirects off-site, so it needs a
                    full navigation rather than client-side routing. */}
                <Button render={<a href="/setup/github/start" />}>
                  Install on GitHub
                </Button>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Signing in identified you. Installing grants Atlas Indexer read
                access to the repositories you select.
              </CardContent>
            </Card>
          ) : null}

          {session ? <RepositoryLookup /> : null}

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
                    ? "font-semibold text-emerald-400"
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
