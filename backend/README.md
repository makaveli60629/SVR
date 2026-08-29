# SVR Backend Authority

This directory contains multiple generations of backend work. They are **not equivalent production services**.

## Current production account state

The public player client contract is defined by `site/config/player-api.json`.

As of the Phase 422 full-stack audit:

- Provider target: AWS
- Identity target: Cognito
- Storage target: DynamoDB
- Remote account API endpoint: **not configured** (`apiBase` is empty)
- Registration/login/profile/daily reward/session/hand telemetry: local browser fallback until a reachable remote API is provisioned and verified

The AWS infrastructure foundation lives in `infrastructure/aws/phase372-player-account-foundation.yml`, but the repository does not currently contain a complete deployed Lambda/API implementation that proves the public account endpoint is live.

## Backend directories

### `backend/server.js`
Legacy Phase 211 marker-health development service. It is **not** the owner/admin/store/player account production API. Do not deploy the repository `backend/` root and assume account/login routes will be present.

### `backend/backend/`
Legacy Azure SQL admin/store prototype. It includes health, messages, admin login/status, store products, Stripe-gated checkout, and hand-result routes. It is retained as historical/reference code and is **not the current public account authority**.

### `backend/phase345/`
Hardened browser-contract account API reference using Express, SQL, bcrypt, HTTP-only JWT cookies, rate limiting, parameterized queries, and transactional reward logic. Its README correctly states that it is deployable source, not proof of a deployed service.

## Security rules

- Never commit `.env`, connection strings, passwords, JWT secrets, Stripe secret keys, or cloud credentials.
- Never commit `node_modules/`.
- If any real secret was ever committed in history, rotate it; deleting the file from the current tree does not erase Git history.
- Do not report the database/API as online unless a remote health endpoint has been provisioned and verified.
- Do not expose raw database error details to public clients in production.

## Production deployment authority

Static site/game deployment is controlled by `.github/workflows/deploy.yml` (`SVR Production Auto Deploy`).

The separate Pages workflow is verification-only after this audit and must not publish a second competing Pages artifact.

## Before enabling remote account mode

1. Provision the chosen remote account API.
2. Verify its health endpoint from the public internet.
3. Verify registration, login, logout, session, profile, daily reward, session telemetry, and hand telemetry end-to-end.
4. Set `site/config/player-api.json.apiBase` to the verified endpoint and set `accountApiEndpointConfigured` to `true` in the same release.
5. Run the production workflow and confirm `deploy-health.json` references the expected source SHA.
