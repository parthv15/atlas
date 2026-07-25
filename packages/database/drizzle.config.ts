import { readDatabaseEnvironment } from "@atlas/config";
import { defineConfig } from "drizzle-kit";

const environment = readDatabaseEnvironment();

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/schema.ts", "./src/auth-schema.ts"],
  out: "./drizzle",
  dbCredentials: {
    url: environment.DATABASE_URL,
  },
});
