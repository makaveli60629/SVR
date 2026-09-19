-- SVR Resource Direct Fallback v3
ALTER TABLE resource_assets ADD COLUMN IF NOT EXISTS storage_backend TEXT NOT NULL DEFAULT 's3';
CREATE TABLE IF NOT EXISTS resource_blobs (
  resource_id UUID PRIMARY KEY REFERENCES resource_assets(id) ON DELETE CASCADE,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
