-- SVR Resource Manager v2
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE resource_assets ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE resource_assets ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE resource_assets ADD COLUMN IF NOT EXISTS archived_by TEXT;

CREATE TABLE IF NOT EXISTS resource_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resource_assets(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_key TEXT NOT NULL DEFAULT 'primary',
  assigned_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(target_type,target_key)
);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource ON resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_target ON resource_assignments(target_type,target_key);
