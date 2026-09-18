-- SVR Resource Asset Library v1
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS resource_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  object_key TEXT UNIQUE NOT NULL,
  bucket_name TEXT NOT NULL,
  extension TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  category TEXT NOT NULL DEFAULT '3d-model',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_resource_assets_created_at ON resource_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_assets_status ON resource_assets (status);
CREATE INDEX IF NOT EXISTS idx_resource_assets_category ON resource_assets (category);
