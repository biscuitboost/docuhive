-- Invoice Generator — persist invoices per tenant
-- Pattern: tenant-scoped, header + line-items (one-to-many), date-indexed
-- To apply: run via scripts/apply-migration-defaults.js
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "invoice_number" text NOT NULL,
  "company_name" text NOT NULL,
  "company_address" text,
  "company_email" text,
  "client_name" text NOT NULL,
  "client_address" text,
  "client_email" text,
  "invoice_date" date NOT NULL,
  "due_date" date NOT NULL,
  "include_vat" boolean DEFAULT true NOT NULL,
  "vat_rate" numeric(4, 2) DEFAULT 20 NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "description" text NOT NULL,
  "quantity" numeric(12, 2) NOT NULL,
  "unit_price" numeric(12, 2) NOT NULL,
  "line_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_tenant_id_idx" ON "invoices" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_date_idx" ON "invoices" ("invoice_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_line_items_invoice_id_idx" ON "invoice_line_items" ("invoice_id");