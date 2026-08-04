# Phase 174 — Stable Floor Hand Teleport + Table/Sky Cleanup Lock

## Scope
Game-side only. No website/site changes.

## Teleport fixes
- Pinch/fist is ignored while teleport is OFF.
- Pinch cannot toggle teleport ON.
- Face toggle requires fist only; pinch is excluded from the ON/OFF gesture.
- Target must stay stable for 650 ms before a release can move the player.
- Movement happens only once on release.
- Target drift limit tightened to 0.045 world units.
- Teleport ray/marker stays locked to the current floor level.
- Ground floor target stays on ground floor.
- Upstairs target stays on upstairs floor after the player is actually upstairs.
- Old hand movement is restored if it moves the player while OFF or while aiming.

## Overlay fixes
- Aggressive black square / face overlay / vignette / screen overlay purge.
- Purge repeats while runtime is active.

## Table fixes
- Felt and leather surface are rebuilt using the real FBX table bounds.
- Felt and leather rotate with table yaw.
- Old Phase 167/168/172 surface overlays are removed before rebuilding.
- Lobby floor SVR logo is placed in front of the table.
- Table area rails/ropes/posts near the table are removed.

## Sky fixes
- Old Moon/Mars and constellation/squiggle lines are removed.
- New realistic procedural Moon texture.
- New realistic procedural Mars texture.
- Moon is larger and higher.
- Mars is larger/higher and orbits the Moon.
- Moon glow is reduced and softened.

## Runtime audits
```js
SVR_RUN_PHASE174_HAND_TELEPORT_AUDIT()
SVR_RUN_PHASE172_TABLE_FLOOR_AUDIT()
SVR_RUN_PHASE169_SKY_AUDIT()
SVR_RUN_PHASE169_OVERLAY_AUDIT()
```

## Test URL
`/game/?v=phase174-stable-floor-table-sky`
