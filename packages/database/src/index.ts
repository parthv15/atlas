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

export * from "./auth-schema";
export * from "./schema";
