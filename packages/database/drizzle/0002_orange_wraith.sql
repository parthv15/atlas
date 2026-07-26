ALTER TABLE "github_installations" ADD COLUMN "github_account_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "github_installations" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_atlas_account_id_user_id_fk" FOREIGN KEY ("atlas_account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_installations_atlas_account_id_idx" ON "github_installations" USING btree ("atlas_account_id");