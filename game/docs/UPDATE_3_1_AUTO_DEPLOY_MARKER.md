# Phase 345 Auto Deploy Marker

## Build
`PHASE-345-PLAYER-LOGIN-PROFILE-DAILY-REWARD-API-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Validation workflow: `.github/workflows/phase345-account-api-check.yml`

## Static payload
- `site/login.html`
- `site/register.html`
- `site/profile.html`
- `site/config/player-api.json`
- `site/js/phase345-player-account-client.js`
- `site/js/phase345-demo-activity-persistence.js`
- `game/modules/phase345_player_account_activity_bridge.js`
- `game/modules/phase340_platform_manifest.js`
- Android and Quest/desktop entries
- Phase 345 release records and documentation

## Backend payload
- `backend/phase345/package.json`
- `backend/phase345/src/server.js`
- `backend/phase345/sql/001_phase345_player_accounts.sql`
- `backend/phase345/.env.example`
- `backend/phase345/README.md`

The backend folder is not deployed by GitHub Pages. It must be deployed separately to an approved Node host after the Azure SQL migration and environment configuration are completed.

## Account locks
- Production passwords are bcrypt-hashed.
- Production authentication uses an HTTP-only cookie.
- Frontend files contain no SQL connection string, JWT secret, password hash, or production credential.
- Daily rewards require verified activity and use a serializable database transaction.
- Demo mode is visibly labeled and writes only to the local device.

## Runtime QA
```js
window.SVR_PLAYER_ACCOUNT.snapshot()
window.SVR_PHASE345_ACCOUNT_QA()
window.SVR_PHASE345_START_SESSION()
window.SVR_PHASE345_HEARTBEAT()
window.SVR_PHASE345_END_SESSION()
window.SVR_PHASE345_DEMO_ACTIVITY.read()
```

## Locked APK behavior
- APK version: `0.1.0-rc1`
- APK version code: `1`
- Forced update: `false`
- Automatic update prompt: `false`
- Manual update only: `true`
