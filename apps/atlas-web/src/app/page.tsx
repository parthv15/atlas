import { healthResponseSchema } from "@atlas/contracts";

export const dynamic = "force-dynamic";

async function getIndexerStatus() {
  const indexerUrl =
    process.env.ATLAS_INDEXER_URL?.replace(/\/$/, "") ??
    "http://localhost:4000";

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
  const indexer = await getIndexerStatus();

  return (
    <main>
      <div className="eyebrow">Atlas · Genesis</div>
      <h1>Repository context starts here.</h1>
      <p className="lede">
        Atlas will connect to GitHub, index repository activity through the
        Atlas Indexer, and make engineering context easy to explore.
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
