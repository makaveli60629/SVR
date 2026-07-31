# Phase 338 Auto Deploy Marker

## Status
Phase 338 is prepared on a dedicated branch. Merging its pull request into `main` triggers the configured Auto Deploy workflow.

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`
- Scope: Quest/WebXR authoritative bankroll and physical chip-inventory synchronization

## Build
`PHASE-338-BANKROLL-CHIP-INVENTORY-SYNC-LOCK`

## Phase 338 payload
- `game/modules/phase338_bankroll_chip_model.js`
- `game/modules/phase338_bankroll_chip_inventory_sync_lock.js`
- `game/index.html`
- `game/manifest.json`
- `game/android-release.json`
- `game/docs/PHASE_338_BANKROLL_CHIP_INVENTORY_SYNC_LOCK.md`
- `game/docs/UPDATE_3_1_AUTO_DEPLOY_MARKER.md`
- `docs/phase338_bankroll_chip_inventory_sync_lock.md`

## Locked behavior
- Phase 336 remains the authoritative stack and payout ledger.
- Phase 337 remains the authoritative pot and winner-settlement presentation.
- The player's visible unlocked chips equal the Phase 336 stack.
- Held and thrown chips remain accounted for until commitment.
- Committed chips are reclaimed after settlement rather than during pot animation.
- Busted players remain at zero.
- The existing Phase 332 32-chip pool remains the interaction authority.

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
- Phase 338 does not claim completed server-authoritative multiplayer.
