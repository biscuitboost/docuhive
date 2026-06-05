-- Expense Tracker — persist expenses per tenant
-- Pattern: tenant-scoped CRUD, numeric decimal amounts, date-indexed for time-series queries
-- To apply: run via scripts/apply-migration-defaults.js
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "description" text NOT NULL,
  "category" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "date" date NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_tenant_id_idx" ON "expenses" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses" ("date");