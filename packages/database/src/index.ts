import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as authSchema from "./auth-schema";
import * as atlasSchema from "./schema";

const schema = {
  ...atlasSchema,
  ...authSchema,
};

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl);

  return {
    client,
    db: drizzle(client, { schema }),
  };
}

/** The schema-aware Drizzle client, for consumers that accept one. */
export type Database = ReturnType<typeof createDatabase>["db"];

export * from "./auth-schema";
export * from "./schema";
