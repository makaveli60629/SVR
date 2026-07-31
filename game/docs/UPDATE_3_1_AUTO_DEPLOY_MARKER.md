# Phase 336 Auto Deploy Marker

## Status
Phase 336 is prepared on a dedicated branch. Merging its pull request into `main` triggers the configured Auto Deploy workflow.

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`
- Scope: Quest/WebXR gameplay plus the existing stable Android and director routes

## Build
`PHASE-336-AUTHORITATIVE-POKER-RULES-POT-SETTLEMENT-LOCK`

## Phase 336 payload
- `game/modules/p85_poker_truth_lock.js`
- `game/modules/phase336_poker_evaluator.js`
- `game/modules/phase336_authoritative_engine.js`
- `game/modules/phase336_poker_visual_bridge.js`
- `game/modules/phase336_authoritative_poker_rules_pot_settlement_lock.js`
- `game/index.html`
- `game/manifest.json`
- `game/android-release.json`
- `game/docs/PHASE_336_AUTHORITATIVE_POKER_RULES_POT_SETTLEMENT_LOCK.md`
- `game/docs/UPDATE_3_1_AUTO_DEPLOY_MARKER.md`
- `docs/phase336_authoritative_poker_rules_pot_settlement_lock.md`

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
- Phase 336 does not claim completed server-authoritative multiplayer.
