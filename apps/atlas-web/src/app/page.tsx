import { readWebEnvironment } from "@atlas/config";
import { healthResponseSchema } from "@atlas/contracts";

import { AuthControls } from "../components/auth-controls";
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
    <main>
      <header className="site-header">
        <div className="eyebrow">Atlas · Genesis</div>
        <AuthControls />
      </header>
      <h1>Repository context starts here.</h1>
      <p className="lede">
        {session
          ? `Welcome back, ${session.user.name}. Atlas is ready to connect your GitHub repositories.`
          : "Sign in with GitHub to connect repositories, index their activity, and make engineering context easy to explore."}
      </p>

      <section className="status" aria-label="Indexer connection status">
        <div>
          <strong>Atlas Indexer</strong>
          <p>Server-to-server health check</p>
        </div>
        <div
          className="status-value"
          data-connected={String(indexer.connected)}
        >
          {indexer.label}
        </div>
      </section>
    </main>
  );
}
