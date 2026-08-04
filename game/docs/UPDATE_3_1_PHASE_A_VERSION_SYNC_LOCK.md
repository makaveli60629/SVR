# Update 3.1-A — Version Sync Lock

## Purpose
This phase starts Update 3.1 by locking the active build label and confirming which files must move together before lobby geometry work continues.

## Current label
`UPDATE-3.1-A-VERSION-SYNC-LOCK`

## Changed files
- `game/update31_version_sync_lock.js`
- `game/phase176_boot.js`
- `game/phase223_phase_diag_log.js`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`
- `game/docs/UPDATE_3_1_PHASE_A_VERSION_SYNC_LOCK.md`

## Runtime effect
- Adds a small Update 3.1-A marker badge.
- Sets `window.SVR_CURRENT_BUILD`.
- Sets `window.SVR_CURRENT_UPDATE`.
- Sets `window.SVR_UPDATE31`.
- Keeps diagnostics active.
- Keeps no-face-overlay protection active.

## Why this phase matters
The next lobby work should not begin while files disagree on the active phase. Update 3.1-A creates the version checkpoint before geometry, Moon, routing, and multiplayer test work begins.

## Deploy rule
The current workflow copies the committed `/game` folder directly into the Pages build. The direct `/game` files must be updated with every phase.

## Next phase
Update 3.1-B — Lobby Structure Completion

Required next tasks:
- solid upstairs floors
- red carpet stairs
- red carpet upstairs
- Roman-style table/patio architecture
- sealed spawn/back wall
- window frames showing futuristic city
