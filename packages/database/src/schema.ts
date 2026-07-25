import {
  bigint,
  bigserial,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const syncStatus = pgEnum("sync_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
]);

export const githubInstallations = pgTable(
  "github_installations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    githubInstallationId: bigint("github_installation_id", {
      mode: "number",
    }).notNull(),
    atlasAccountId: text("atlas_account_id").notNull(),
    githubAccountLogin: text("github_account_login").notNull(),
    githubAccountType: text("github_account_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("github_installations_github_id_unique").on(
      table.githubInstallationId,
    ),
  ],
);

export const repositories = pgTable(
  "repositories",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    githubRepositoryId: bigint("github_repository_id", {
      mode: "number",
    }).notNull(),
    installationId: bigint("installation_id", { mode: "number" })
      .references(() => githubInstallations.id)
      .notNull(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    defaultBranch: text("default_branch"),
    lastIndexedAt: timestamp("last_indexed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("repositories_github_id_unique").on(table.githubRepositoryId),
  ],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    githubDeliveryId: text("github_delivery_id").notNull(),
    eventName: text("event_name").notNull(),
    action: text("action"),
    payload: jsonb("payload").notNull(),
    status: syncStatus("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("webhook_deliveries_delivery_id_unique").on(
      table.githubDeliveryId,
    ),
  ],
);

export const syncRuns = pgTable("sync_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  installationId: bigint("installation_id", { mode: "number" })
    .references(() => githubInstallations.id)
    .notNull(),
  repositoryId: bigint("repository_id", { mode: "number" }).references(
    () => repositories.id,
  ),
  trigger: text("trigger").notNull(),
  status: syncStatus("status").default("pending").notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
