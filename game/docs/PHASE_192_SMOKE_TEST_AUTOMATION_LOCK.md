# Phase 199 — Smoke Test Automation Lock

Build: `PHASE-222-POST-DEPLOY-CHECKLIST-LOCK`

## Added
- `game/modules/smoke_test.js`
- `window.SVR_SMOKE_TEST`
- Press **T** in the game to run/toggle the smoke-test overlay.
- Smoke test checks build/version, deploy-health files, QA/export/verifier modules, scene navigation, HUD, and canvas readiness.

## Protected
- Public Matrix launch page untouched.
- Dealer body remains disabled.
- Invisible card/deal logic preserved.
- Unapproved wellness/founder branding remains removed.
