CREATE TABLE "tenant_legislative_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"update_id" uuid NOT NULL,
	"actioned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_legislative_actions" ADD CONSTRAINT "tenant_legislative_actions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_legislative_actions" ADD CONSTRAINT "tenant_legislative_actions_update_id_legislative_updates_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."legislative_updates"("id") ON DELETE no action ON UPDATE no action;