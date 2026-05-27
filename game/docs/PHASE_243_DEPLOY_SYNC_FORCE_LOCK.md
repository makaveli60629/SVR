# PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK

## Purpose
Phase 244 forces deploy synchronization when GitHub repo is ahead of the live GitHub Pages build.

## Why
Repo was confirmed at Phase 244, but the user's live game still reported Phase 238. This phase adds a new committed phase marker and an explicit forced packet command so the updater cannot accidentally reuse an older packet.

## Direct fixes
- Adds `game/deploy-sync-force.json`
- Adds `game/modules/deploy_sync_force.js`
- Adds `window.SVR_DEPLOY_SYNC_FORCE`
- Updates cache markers to Phase 244
- Updates PowerShell deploy script to detect the current phase dynamically instead of hardcoding Phase 234 in smoke probes
- Requires forced packet command for this run

## Preserved locks
- Watch teleport conflict guard remains.
- Watch upright correction remains.
- Fire lightning arch and hands remain.
- Hand teleport behavior remains.
- Quest right-stick autocalibration remains.
- Spawn-front chair clear remains.
- Public Matrix launch page untouched.

## Test
Open `/game/?v=phase252-deploysync` and press `F8`.
