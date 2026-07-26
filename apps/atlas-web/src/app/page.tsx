import { readWebEnvironment } from "@atlas/config";
import { healthResponseSchema } from "@atlas/contracts";

import { AuthControls } from "../components/auth-controls";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { getServerSession } from "../lib/get-server-session";

export const dynamic = "force-dynamic";

async function getIndexerStatus() {
  const indexerUrl = readWebEnvironment().ATLAS_INDEXER_URL.replace(/\/$/, "");

  try {
    const response = await fetch(`${indexerUrl}/v1/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });

    if (!response.ok) {
      return { connected: false, label: `HTTP ${response.status}` };
    }

    const health = healthResponseSchema.parse(await response.json());
    return { connected: true, label: health.status };
  } catch {
    return { connected: false, label: "unavailable" };
  }
}

export default async function Home() {
  const [indexer, session] = await Promise.all([
    getIndexerStatus(),
    getServerSession(),
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
    </main>
  );
}
