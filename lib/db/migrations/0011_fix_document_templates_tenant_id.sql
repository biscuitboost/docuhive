-- Add tenant_id to document_templates (was missing from original migration)
--> statement-breakpoint
ALTER TABLE "document_templates" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "public"."tenants"("id");
--> statement-breakpoint
-- Backfill any existing rows (there may be none, but safe to run)
UPDATE "document_templates" SET "tenant_id" = (SELECT "id" FROM "tenants" LIMIT 1) WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "document_templates" ALTER COLUMN "tenant_id" SET NOT NULL;