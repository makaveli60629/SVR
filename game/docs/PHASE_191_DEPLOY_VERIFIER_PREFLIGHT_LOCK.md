# Phase 199 — Deploy Verifier Preflight Lock

Build: `PHASE-238-HAND-TELEPORT-PINCH-DESTINATION-LOCK`

## Purpose
Adds an in-game deploy verifier so stale GitHub Pages deploys and build/version drift can be detected before long Quest tests.

## Added
- `game/modules/deploy_verify.js`
- `window.SVR_DEPLOY_VERIFIER`
- Keyboard toggle: `V`
- Browser event: `svr_deploy_preflight_update`
- Checks game `version.json`, game `deploy-health.json`, root `deploy-health.json`, QA module, and session export module.

## Protected
- Public Matrix launch page untouched.
- Dealer body remains disabled.
- Invisible card/deal logic preserved.
- Unapproved Reiki/AWAITING APPROVAL/founder references remain removed.
