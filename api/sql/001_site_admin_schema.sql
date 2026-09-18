-- SVR Site/Admin PostgreSQL canonical schema
-- Contract: api/database-contract.json
-- Idempotent for fresh deployments. Existing installations should run this file
-- before application startup; the application then audits every required field.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'SVR Owner',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users (is_active);

CREATE TABLE IF NOT EXISTS admin_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  status_text TEXT NOT NULL DEFAULT 'Admin Offline',
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_admin_status CHECK (id = 1)
);
INSERT INTO admin_status (id, is_online, status_text)
VALUES (1, FALSE, 'Admin Offline')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'public_site',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  archived_by TEXT
);
ALTER TABLE site_messages ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE site_messages ADD COLUMN IF NOT EXISTS archived_by TEXT;
CREATE INDEX IF NOT EXISTS idx_site_messages_created_at ON site_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_messages_unread ON site_messages (is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL DEFAULT 'general',
  name TEXT,
  email TEXT,
  phone TEXT,
  organization TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'site',
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  archived_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON marketing_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON marketing_leads (status);

CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'svr',
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  image_url TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_sandbox_only BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items (category);
CREATE INDEX IF NOT EXISTS idx_store_items_active ON store_items (is_active);

CREATE TABLE IF NOT EXISTS game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  room TEXT,
  build TEXT,
  session_id TEXT,
  source TEXT NOT NULL DEFAULT 'game',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_game_events_created_at ON game_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events (event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_room ON game_events (room);
CREATE INDEX IF NOT EXISTS idx_game_events_session ON game_events (session_id);

CREATE TABLE IF NOT EXISTS site_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL DEFAULT 'page_view',
  page_path TEXT,
  page_title TEXT,
  referrer TEXT,
  session_id TEXT,
  source TEXT NOT NULL DEFAULT 'site',
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at ON site_analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_analytics_event_type ON site_analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_site_analytics_page_path ON site_analytics_events (page_path);
CREATE INDEX IF NOT EXISTS idx_site_analytics_session_id ON site_analytics_events (session_id);

CREATE TABLE IF NOT EXISTS admin_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
  sha256 TEXT NOT NULL,
  payload BYTEA NOT NULL,
  notes TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_uploads_created_at ON admin_uploads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_uploads_active ON admin_uploads (deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_uploads_sha256 ON admin_uploads (sha256);
