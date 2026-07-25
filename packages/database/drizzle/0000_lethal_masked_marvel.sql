CREATE TYPE "public"."sync_status" AS ENUM('pending', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "github_installations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"github_installation_id" bigint NOT NULL,
	"atlas_account_id" text NOT NULL,
	"github_account_login" text NOT NULL,
	"github_account_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"github_repository_id" bigint NOT NULL,
	"installation_id" bigint NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"default_branch" text,
	"last_indexed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"installation_id" bigint NOT NULL,
	"repository_id" bigint,
	"trigger" text NOT NULL,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"github_delivery_id" text NOT NULL,
	"event_name" text NOT NULL,
	"action" text,
	"payload" jsonb NOT NULL,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_installation_id_github_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."github_installations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_installation_id_github_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."github_installations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_installations_github_id_unique" ON "github_installations" USING btree ("github_installation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_github_id_unique" ON "repositories" USING btree ("github_repository_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_deliveries_delivery_id_unique" ON "webhook_deliveries" USING btree ("github_delivery_id");