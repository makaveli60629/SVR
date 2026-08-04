# Phase 270 Live Build Pointer Lock

Build: `PHASE-270-LIVE-BUILD-POINTER-LOCK`

Track: game-only live build pointer

Site touched: no

## Purpose

Phase 270 aligns the boot loader, the late runtime shim, and the version files around one live build pointer.

## Runtime Pointer

```text
window.SVR_LIVE_BUILD_POINTER = PHASE-270-LIVE-BUILD-POINTER-LOCK
```

## Files Updated

```text
game/index.html
game/phase101s_finished_lobby_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Preserved Work

- Phase 261 new lobby baseline
- Phase 265 pillar and sign clearance
- Phase 266 Quest LOD cleanup
- Phase 269 boot cache busting
- high Moon and Mars placement
- game-only scope

## Manual QA

Open:

```text
https://svrpoker.com/game/?v=phase270-live-build-pointer
```

Check:

- boot card says Phase 270
- runtime title/status resolves to Phase 270
- live build pointer exists in console
- signs remain readable
- pillars remain in the gaps
- Quest cleanup remains active
- site remains unchanged
