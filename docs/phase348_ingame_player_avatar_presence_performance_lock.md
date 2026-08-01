# Phase 348 Repository Handoff

## Build

`PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK`

## Delivered

- Selected Phase 346 profile avatar instantiated in the playable scene.
- Eric and Claudia FBX bodies supported.
- FBX plus GLB/glTF loading path.
- Procedural fallback body.
- Standing rig follow.
- Canonical south/front seated placement.
- Safe seated head/neck look reaction.
- Outfit palette and lightweight equipment layers.
- Duplicate local-avatar root cleanup.
- Android, Quest, and desktop performance budgets.
- Camera 3 exclusion.
- Phase 348 static validation and GitHub Actions workflow.

## Runtime

`game/modules/phase348_ingame_player_avatar_presence_performance_lock.js`

## Validation

`.github/workflows/phase348-avatar-runtime-check.yml`

`game/tools/phase348-avatar-runtime-static-test.mjs`

## Routes

- Android: `/game/android.html?channel=stable&v=phase348`
- Quest/PC: `/game/index.html?v=phase348`
- Avatar creator: `/site/avatar.html?v=phase346`

## Protected locks

- Phase 347 remains the Android control/card/table presentation authority.
- Phase 346 remains the avatar profile schema authority.
- Phase 341 remains the table-seat coordinate authority.
- Camera 3 remains spectator-only.
- APK remains `0.1.0-rc1`, code `1`, with no forced or automatic update prompt.
