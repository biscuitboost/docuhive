CREATE TYPE "public"."email_status" AS ENUM('sent', 'delivered', 'opened', 'failed');--> statement-breakpoint
CREATE TABLE "email_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"recipient_email" text NOT NULL,
	"sender_name" text,
	"status" "email_status" DEFAULT 'sent' NOT NULL,
	"opened_at" timestamp,
	"share_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_form_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"doc_type" text NOT NULL,
	"form_values" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_templates" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "shared_with" text[];--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "company_address" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "company_number" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "vat_number" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_employment_type" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_salary_period" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_fee_period" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_payment_terms" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_notice_period" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_probation_period" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_pension_scheme" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_sick_pay" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_holiday_entitlement" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_working_hours" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_confidentiality_period" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "ico_registration_number" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "dpo_name" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "dpo_email" text;--> statement-breakpoint
ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_form_templates" ADD CONSTRAINT "saved_form_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_share_token_unique" UNIQUE("share_token");