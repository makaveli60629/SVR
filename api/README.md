# SVR Site/Admin PostgreSQL API

This directory contains the current `svr-aws-api` Express/PostgreSQL source for site/admin functions.

## Source capabilities

`server.js` contains source routes for:

- `/api/health`
- admin login/status/presence
- public messages + admin message management
- marketing leads
- store inventory (sandbox-only)
- game event telemetry
- site analytics + admin analytics
- admin logs

The database target is PostgreSQL via `DATABASE_URL`.

## Current public wiring state

The public root site does **not** currently send visitor messages to this service. `site-public-hooks.js` explicitly stores the visitor form locally and says secure API delivery is not enabled on the static page yet.

Do not report this API or PostgreSQL database as live merely because the source exists.

## Phase 419 admin-auth integration gate

`phase419-admin-db-bootstrap.js` creates an `admin_users` table and stores a bcrypt-compatible `pgcrypto` password hash.

`server.js` currently authenticates `/api/admin/login` against private environment variables (`ADMIN_EMAIL` and `ADMIN_PASSWORD`) rather than the `admin_users` table.

That means the Phase 419 database bootstrap and the current login route are **not one integrated auth flow yet**. A successful bootstrap alone does not make owner login work.

Before production owner/admin login is enabled, choose and test one authority:

1. preferred: authenticate against `admin_users` using the database hash and remove plaintext-password comparison from runtime; or
2. temporary/private only: keep environment-based admin login and do not claim the Phase 419 database user is active.

Do not run both as competing authorities.

## Security gates before production wiring

- `DATABASE_URL`, admin credentials, JWT secrets, and cloud credentials must remain private environment variables.
- `ADMIN_JWT_SECRET` must never use the development fallback.
- Remove raw database error details from public responses before exposing the service broadly.
- Add rate limiting/abuse controls to public write endpoints before sending public traffic to them.
- Review TLS certificate validation for the actual managed PostgreSQL provider; do not treat `rejectUnauthorized:false` as a permanent production default without provider-specific justification.
- Verify CORS against `https://svrpoker.com`.
- Verify admin login, status, messages, leads, store, analytics, and game event routes against the deployed database.

## Separate player-account authority

This PostgreSQL site/admin API is not the same thing as the player-account contract in `site/config/player-api.json`, which currently targets AWS Cognito + DynamoDB and still has no configured remote account API base URL.
