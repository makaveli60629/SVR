-- PHASE-419-ADMIN-TOURNAMENT-DATABASE-FOUNDATION-LOCK
-- No plaintext password is stored in this migration.
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

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id BIGINT NOT NULL,
  player_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'mobile-play-money-test',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(slot_id, player_id)
);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_slot ON tournament_registrations (slot_id, registered_at ASC);

-- Create the owner row with:
--   ADMIN_USERNAME=admin
--   ADMIN_INITIAL_PASSWORD=<private temporary password>
--   npm run bootstrap:admin
-- The bootstrap hashes the password with pgcrypto/bcrypt and marks the account for password change.
