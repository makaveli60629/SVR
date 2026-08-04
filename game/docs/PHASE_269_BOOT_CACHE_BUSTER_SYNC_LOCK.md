# Phase 269 Boot Cache Buster Sync Lock

Build: `PHASE-269-BOOT-CACHE-BUSTER-SYNC-LOCK`

Track: game-only boot cache buster sync

Site touched: no

## Purpose

Phase 269 updates the game boot loader so the browser requests Phase 269 module URLs instead of older Phase 266 URLs.

## Protected Baseline

- Phase 261 new lobby remains active.
- Phase 265 pillar/sign clearance remains protected.
- Phase 266 Quest LOD cleanup remains protected.
- Phase 268 runtime cache sync remains protected.
- No Phase 84 rollback.
- No website changes.
- No Trueitive or founder content.

## Files Updated

```text
game/index.html
game/phase101s_finished_lobby_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Result

- boot card reports Phase 269
- index loader requests cache-busted Phase 269 module URLs
- late runtime shim reports Phase 269
- performance cleanup remains active
- pillar and sign clearance remains active
- high Moon and Mars lock remains active

## Manual QA

Open:

```text
https://svrpoker.com/game/?v=phase269-boot-cache-buster-sync
```

Check:

- boot card says Phase 269
- runtime title/status resolves to Phase 269 after load
- signs remain readable
- pillars remain in gaps instead of in front of signs
- Quest LOD cleanup remains active
- no duplicate Moon/Mars from late overlay geometry
- no Phase 84 rollback
- site remains unchanged
