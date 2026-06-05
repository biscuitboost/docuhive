CREATE TYPE "jurisdiction" AS ENUM('england_wales', 'scotland');
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "jurisdiction" text DEFAULT 'england_wales' NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "jurisdiction" text;