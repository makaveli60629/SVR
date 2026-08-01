# Phase 351 — Profile 3D Showroom Lock

## Build
`PHASE-351-PROFILE-3D-SHOWROOM-LOCK`

## Purpose
Replace the small profile portrait with a dedicated in-game-style room that displays the same saved player avatar and equipped outfit used by Android, Quest, PC, and the dressing room.

## Showroom features
- Full-width responsive 3D room
- Eric/Claudia FBX or future GLB body loading
- Saved `avatarUrl` and `equippedOutfit` profile authority
- Circular display platform
- SVR wall logo
- Side display panels
- Neon floor lines
- Key, fill, rim, and gold accent lighting
- Drag-to-orbit and pinch/wheel zoom
- Automatic rotation toggle
- Reset view
- Fullscreen mode
- Direct Dressing Room link

## Recovery behavior
The showroom draws a Canvas2D room and avatar immediately. Account, catalog, Three.js, viewer, and avatar-model loading each have bounded timeouts. If 3D fails, the fallback remains visible with a Retry control.

## Runtime QA
```js
window.SVR_PHASE351_PROFILE_SHOWROOM_QA()
window.SVR_PHASE351_PROFILE_SHOWROOM_RETRY()
window.SVR_PHASE351_PROFILE_SHOWROOM_RESET()
window.SVR_PHASE351_PROFILE_SHOWROOM_STATE
```

Phase 350 compatibility aliases remain available:
```js
window.SVR_PHASE350_PROFILE_AVATAR_QA()
window.SVR_PHASE350_PROFILE_AVATAR_RETRY()
window.SVR_PHASE350_PROFILE_AVATAR_RESET()
```

## Protected scope
- Phase 350 Android, Camera 3, and site-integrity authorities remain unchanged.
- Phase 345 account/demo profile authority remains unchanged.
- Phase 346 dressing-room viewer remains the avatar loader.
- Game build remains Phase 350.
- APK remains `0.1.0-rc1`, code `1`, manual-update only.
