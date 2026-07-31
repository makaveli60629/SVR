# Phase 337 Auto Deploy Marker

## Status
Phase 337 is prepared on a dedicated branch. Merging its pull request into `main` triggers the configured Auto Deploy workflow.

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`
- Scope: Quest/WebXR physical pot and winner settlement presentation

## Build
`PHASE-337-PHYSICAL-POT-WINNER-SETTLEMENT-LOCK`

## Phase 337 payload
- `game/modules/phase337_pot_visual_model.js`
- `game/modules/phase337_physical_pot_winner_settlement_lock.js`
- `game/index.html`
- `game/manifest.json`
- `game/android-release.json`
- `game/docs/PHASE_337_PHYSICAL_POT_WINNER_SETTLEMENT_LOCK.md`
- `game/docs/UPDATE_3_1_AUTO_DEPLOY_MARKER.md`
- `docs/phase337_physical_pot_winner_settlement_lock.md`

## Locked release policy
- APK version name: `0.1.0-rc1`
- APK version code: `1`
- Forced update: `false`
- Update prompt: `false`
- Stable Android entry: `/game/android.html?channel=stable`

## Protected scope
- Public website untouched.
- Sponsor and partner content untouched.
- Existing uploaded table remains the sole table authority.
- Phase 337 does not claim completed server-authoritative multiplayer.
