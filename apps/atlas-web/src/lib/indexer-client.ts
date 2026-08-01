import "server-only";

import { readWebEnvironment } from "@atlas/config";
import { healthResponseSchema } from "@atlas/contracts";

function indexerUrl(path: string): string {
  const base = readWebEnvironment().ATLAS_INDEXER_URL.replace(/\/$/, "");

  return `${base}${path}`;
}

export interface IndexerHealth {
  connected: boolean;
  label: string;
}

export async function getIndexerHealth(): Promise<IndexerHealth> {
  try {
    const response = await fetch(indexerUrl("/v1/health"), {
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
