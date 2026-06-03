ALTER TABLE "tenants" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "primary_color" text DEFAULT '#2563eb';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "document_footer" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "document_header" text;