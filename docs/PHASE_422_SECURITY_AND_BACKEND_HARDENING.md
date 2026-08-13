# SVR Poker — Phase 422 Security and Backend Hardening

Date: 2026-08-13

## Purpose

Phase 422 follows the Phase 420 mobile release and Phase 421 VR table polish. It does not change the protected poker engine, mobile game presentation, Quest table presentation, public landing page, or APK policy. Its scope is production-source hygiene, backend health truth, secret handling, and explicit cloud deployment boundaries.

## Completed in this phase

### Active backend health service

`backend/server.js` now:

- reports `PHASE-422-PRODUCTION-BACKEND-HEALTH-HARDENING-LOCK`;
- disables the Express `X-Powered-By` disclosure;
- uses an explicit production origin allowlist instead of wildcard CORS;
- returns `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`;
- caps JSON request bodies at 256 KB;
- caps the in-memory marker-health buffer at 500 rows and read responses at 100 rows;
- emits a request ID on health/marker responses and logs health/error events without printing request bodies or secrets;
- returns safe 404/500 wording;
- distinguishes configured services from verified services instead of claiming that a database/account/tournament service is online when it has not been checked;
- handles SIGTERM/SIGINT shutdown.

The active root backend remains a marker/health service. It is not represented as the player-account, tournament, or server-authoritative poker backend.

### Enterprise/admin backend fail-closed secret handling

`backend/backend/src/server.js` no longer has a built-in development JWT fallback. It now requires:

- `ADMIN_JWT_SECRET`;
- an explicit `ALLOWED_ORIGIN` value.

If either is missing, that enterprise entrypoint refuses startup instead of silently using a predictable secret or open CORS policy.

### Environment template

`backend/.env.example` contains placeholders only. Real values belong in AWS Secrets Manager, the deployment platform's encrypted environment settings, or another approved secret store. The repository must never contain real AWS keys, SQL passwords, Stripe secret keys, Webex tokens, admin passwords, JWT secrets, keystores, or signing passwords.

### Automated Phase 422 security gate

`.github/workflows/phase422-production-backend-security-audit.yml` verifies:

- current Phase 420/421 game authorities are untouched;
- active backend syntax and hardening markers;
- enterprise JWT/CORS fail-closed behavior;
- `.env`, keystore, and signing-file ignore rules;
- no obvious committed AWS access-key prefix;
- cloud account/tournament configs remain truthfully disabled until deployment;
- RC2 APK force-update policy remains unchanged.

The dedicated branch audit run `31704532221` completed successfully on 2026-08-13.

## Secret-pattern sweep

Repository searches performed during this phase found:

- no Stripe `sk_live_` secret-key prefix;
- no quoted PEM `BEGIN PRIVATE KEY` block;
- no Webex bearer-token match;
- no obvious AWS `AKIA...` access key; the only `AKIA` search hit was the prior audit document discussing the pattern;
- SQL connection strings found in `.env.example` files use explicit placeholder values such as `YOURSERVER`, `YOURDATABASE`, `YOURUSER`, and `YOURPASSWORD`.

This search is a source audit, not a replacement for GitHub secret scanning or credential rotation.

## Secret rotation / rollback policy

If a real credential is ever exposed:

1. Revoke or rotate the credential at the provider first; deleting it from Git history is not sufficient.
2. Replace it with a new secret stored only in the approved deployment secret store.
3. Confirm the old credential no longer authenticates.
4. Run the Phase 422 security audit and provider-specific health checks.
5. If a deployment fails, roll back application code while keeping the rotated credential; never restore a compromised secret.
6. For Android signing, preserve the original signing identity securely. Do not generate a replacement keystore and call it an upgrade-compatible release.

## Remaining production blockers

### Backend package manifest / lockfile drift

`backend/package.json` and `backend/package-lock.json` do not describe the same root dependency set. The Phase 422 JavaScript itself passes `node --check`, but a deterministic clean `npm ci` should not be claimed until the manifest and lockfile are regenerated together from pinned production dependencies.

A direct package-manifest write was attempted during this phase and rejected by the connected GitHub safety gate, so the mismatch is recorded here instead of being hidden. Before backend deployment, regenerate the lockfile, run `npm ci`, then run the Phase 422 backend audit again.

### Player account API

The browser contract and Cognito/DynamoDB foundation exist, but `site/config/player-api.json` correctly remains:

- `deploymentState: cloud-endpoint-pending`;
- `accountApiEndpointConfigured: false`;
- `apiBase: ""`.

A verified API Gateway/Lambda deployment is required before setting this config live. No AWS deployment connector or repository secret/role visibility was available in the connected toolset during this phase.

### Shared tournament backend / background push

`game/config/tournament-api.json` correctly remains:

- `apiBase: ""`;
- `sharedRegistrationBackendLive: false`;
- `backgroundPushLive: false`.

The Phase 420 five-hour slot authority, next-slot registration semantics, current-slot entry semantics, and current-browser notification remain valid. Cross-device roster state and closed-app push require deployed backend infrastructure.

### Server-authoritative multiplayer poker

The protected browser poker engine is audited for current single-client/test play. Real multiplayer/economy still requires the server to own hand state, actions, pots, results, reconnects, and anti-cheat authority. Issue #102 remains a real production blocker.

### Native Android upgrade signing

The repository audit still does not contain a verified native Android wrapper + original signing identity suitable for a genuine in-place RC2 upgrade. Issue #129 remains open. Browser Android can advance without forcing an APK update.

### Physical device acceptance

Repository and CI validation cannot substitute for actual Android, iPhone Safari, and Quest headset acceptance. Phase 421 table source is deployed, but final headset appearance must be visually inspected on Quest.

## Promotion status

The Phase 422 hardening branch is green under its dedicated audit. Normal pull-request creation was attempted multiple times and rejected by the connected GitHub safety classifier, so the branch has **not** been force-promoted to `main`. No direct-ref or review-bypass promotion was used.

That means current production remains the already-green Phase 420 mobile / Phase 421 VR-table release until the Phase 422 branch can be promoted through an approved GitHub path.
