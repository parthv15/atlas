import { readWebEnvironment } from "@atlas/config";
import * as schema from "@atlas/database";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

import { database } from "./database";

const environment = readWebEnvironment();
export const auth = betterAuth({
  baseURL: environment.BETTER_AUTH_URL,
  database: drizzleAdapter(database, {
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
