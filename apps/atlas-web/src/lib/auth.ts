import { readWebEnvironment } from "@atlas/config";
import { createDatabase } from "@atlas/database";
import * as schema from "@atlas/database";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

const environment = readWebEnvironment();
const { db } = createDatabase(environment.DATABASE_URL);

export const auth = betterAuth({
  baseURL: environment.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: environment.BETTER_AUTH_SECRET,
  socialProviders: {
    github: {
      clientId: environment.GITHUB_CLIENT_ID,
      clientSecret: environment.GITHUB_CLIENT_SECRET,
    },
  },
});
