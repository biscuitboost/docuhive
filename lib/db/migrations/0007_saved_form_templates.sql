-- Create saved_form_templates table for user-saved form value templates
CREATE TABLE IF NOT EXISTS saved_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  form_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by tenant
CREATE INDEX IF NOT EXISTS idx_saved_form_templates_tenant_id ON saved_form_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_form_templates_tenant_doc_type ON saved_form_templates(tenant_id, doc_type);