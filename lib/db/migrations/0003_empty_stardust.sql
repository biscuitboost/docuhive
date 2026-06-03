CREATE TYPE "public"."change_type" AS ENUM('initial', 'ai_edit', 'manual_edit', 'regenerate', 'restore');--> statement-breakpoint
ALTER TYPE "public"."doc_status" ADD VALUE 'issued';--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"output_data" jsonb NOT NULL,
	"input_data" jsonb,
	"change_type" "change_type" NOT NULL,
	"change_description" text,
	"changed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "current_issued_version" integer;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;