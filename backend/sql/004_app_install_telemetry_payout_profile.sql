-- PHASE-369 APP INSTALL, TELEMETRY AND PAYOUT PROFILE FOUNDATION
-- PostgreSQL 15+ / Amazon Aurora PostgreSQL compatible.
-- Backend derives client IP from the request and stores a keyed hash by default.
-- Do not collect bank routing/account numbers in this schema.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_installations (
  installation_id UUID PRIMARY KEY,
  player_id UUID NULL,
  package_name VARCHAR(160) NOT NULL DEFAULT 'com.svrpoker.app',
  platform VARCHAR(40) NOT NULL,
  app_version_name VARCHAR(40) NOT NULL,
  app_version_code INTEGER NOT NULL,
  signing_certificate_sha256 VARCHAR(128) NULL,
  integrity_verdict VARCHAR(40) NOT NULL DEFAULT 'not_evaluated',
  integrity_checked_at TIMESTAMPTZ NULL,
  first_ip_hash VARCHAR(128) NULL,
  last_ip_hash VARCHAR(128) NULL,
  country_code CHAR(2) NULL,
  user_agent_family VARCHAR(80) NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  tamper_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_installations_player_last_seen_idx
  ON app_installations (player_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS app_installations_integrity_idx
  ON app_installations (integrity_verdict, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS app_telemetry_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NULL REFERENCES app_installations(installation_id) ON DELETE SET NULL,
  player_id UUID NULL,
  event_name VARCHAR(80) NOT NULL,
  page_path VARCHAR(240) NULL,
  app_version_code INTEGER NULL,
  ip_hash VARCHAR(128) NULL,
  integrity_verdict VARCHAR(40) NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_events_install_time_idx
  ON app_telemetry_events (installation_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS app_events_name_time_idx
  ON app_telemetry_events (event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS app_events_player_time_idx
  ON app_telemetry_events (player_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS player_payout_profiles (
  player_id UUID PRIMARY KEY,
  method VARCHAR(24) NOT NULL DEFAULT 'none'
    CHECK (method IN ('none','cash_app','ach_pending')),
  cash_app_tag_ciphertext BYTEA NULL,
  cash_app_tag_last4 VARCHAR(4) NULL,
  ach_provider_customer_id VARCHAR(160) NULL,
  ach_status VARCHAR(40) NOT NULL DEFAULT 'not_requested',
  identity_status VARCHAR(40) NOT NULL DEFAULT 'not_started',
  tax_status VARCHAR(40) NOT NULL DEFAULT 'not_started',
  jurisdiction_status VARCHAR(40) NOT NULL DEFAULT 'not_reviewed',
  compliance_consent_at TIMESTAMPTZ NULL,
  automated_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payout_hold BOOLEAN NOT NULL DEFAULT TRUE,
  hold_reason VARCHAR(240) NOT NULL DEFAULT 'legal-and-provider-review-required',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (automated_payouts_enabled = FALSE)
);

CREATE TABLE IF NOT EXISTS tournament_prize_claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  player_id UUID NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  prize_type VARCHAR(40) NOT NULL DEFAULT 'sponsor_funded_contest',
  status VARCHAR(48) NOT NULL DEFAULT 'pending_compliance',
  eligibility_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  rules_version VARCHAR(80) NULL,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  tax_review_complete BOOLEAN NOT NULL DEFAULT FALSE,
  jurisdiction_review_complete BOOLEAN NOT NULL DEFAULT FALSE,
  provider_approved BOOLEAN NOT NULL DEFAULT FALSE,
  payment_provider VARCHAR(60) NULL,
  provider_reference VARCHAR(180) NULL,
  approved_by UUID NULL,
  approved_at TIMESTAMPTZ NULL,
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, player_id)
);

CREATE INDEX IF NOT EXISTS prize_claims_player_created_idx
  ON tournament_prize_claims (player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS prize_claims_status_created_idx
  ON tournament_prize_claims (status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_player_id UUID NULL,
  action VARCHAR(120) NOT NULL,
  target_type VARCHAR(80) NULL,
  target_id VARCHAR(160) NULL,
  ip_hash VARCHAR(128) NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW app_metrics_daily AS
SELECT
  DATE_TRUNC('day', occurred_at)::date AS metric_date,
  COUNT(*) FILTER (WHERE event_name IN ('apk_download_click','download_center_click')) AS downloads,
  COUNT(*) FILTER (WHERE event_name = 'apk_update_check') AS update_checks,
  COUNT(DISTINCT installation_id) FILTER (WHERE event_name IN ('app_heartbeat','android_web_play_click')) AS active_installations,
  COUNT(DISTINCT player_id) FILTER (WHERE player_id IS NOT NULL) AS active_players
FROM app_telemetry_events
GROUP BY DATE_TRUNC('day', occurred_at)::date;

COMMENT ON COLUMN app_installations.first_ip_hash IS
  'Keyed server-side hash; raw IP should remain in short-retention infrastructure logs only.';
COMMENT ON COLUMN player_payout_profiles.cash_app_tag_ciphertext IS
  'Encrypt with KMS envelope encryption. Never expose in public APIs or logs.';
COMMENT ON TABLE tournament_prize_claims IS
  'All claims remain pending until contest, identity, tax, jurisdiction and provider gates pass.';
