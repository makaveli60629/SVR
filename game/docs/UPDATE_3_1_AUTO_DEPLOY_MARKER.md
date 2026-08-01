# Phase 348 Auto Deploy Marker

## Build
`PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Phase 348 validation workflow: `.github/workflows/phase348-avatar-runtime-check.yml`

## Payload
- `game/modules/phase348_ingame_player_avatar_presence_performance_lock.js`
- `game/modules/phase340_platform_manifest.js`
- `game/index.html`
- `game/android.html`
- `game/manifest.json`
- `game/android-release.json`
- `game/tools/phase348-avatar-runtime-static-test.mjs`
- Phase 348 validation and documentation

## Avatar locks
- One local profile avatar root only.
- Profile source remains Phase 346.
- Eric and Claudia remain verified player body choices.
- FBX and GLB/glTF loading supported.
- Procedural mannequin fallback retained.
- Standing body follows the local rig.
- Seated body uses Phase 341 seat `0`, south/front.
- Head/neck look reaction is clamped and optional.
- Poker-table Eric and Claudia NPC instances remain separate.
- Camera 3 receives no profile or in-game avatar module.

## Performance budgets
- Android: 24 Hz pose, 18 Hz animation, 6 equipment meshes.
- Quest: 30 Hz pose, 24 Hz animation, 5 equipment meshes.
- Desktop: 60 Hz pose, 30 Hz animation, 8 equipment meshes.
- Shadows disabled.
- Frustum culling enabled.
- Duplicate root cleanup enabled.

## Runtime QA
```js
window.SVR_PHASE348_QA()
window.SVR_PHASE348_STATE
window.SVR_PHASE348_BUDGET
window.SVR_PHASE348_RECENTER()
await window.SVR_PHASE348_RELOAD()
```

## Protected Android behavior
- Phase 347 remains the single visible controller authority.
- SIT/LEAVE and seated slide controls remain unchanged.
- Player and community cards remain visible.
- Table logo and raised pot display remain enabled.
- Phase 344 remains the full-hand and single-fire action authority.

## APK release gate
- Current APK: `0.1.0-rc1`, code `1`
- Reserved next APK: `0.1.0-rc2`, code `2`
- Signed native package present: false
- Existing wrapper/signing identity present: false
- `releaseReady`: false
- APK URL: empty
- Forced update: false
- Automatic update prompt: false
- Manual update only: true
