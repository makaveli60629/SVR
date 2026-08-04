# Phase 170 — Hand Teleport Aim Release Fix

## Scope
Game-side only. No lobby redesign. No website/site file changes.

## Problem fixed
The hand teleporter was still using the older hand gesture path. That allowed a hand point/gesture to move the player before the player had time to choose the target.

## Fix
- The movement export now routes through `movement_phase170_teleport_lock.js`.
- The bridge exports live hand input to the Phase 170 module.
- The bridge suppresses the older base hand teleport path while Phase 170 owns hand teleport.
- `phase170_teleport_aim_commit_lock.js` now reads live hand input.
- Hand gesture behavior is now: hold fist/pinch to aim, release to move.
- If the older path moves during aim, Phase 170 restores the pre-aim position.

## Expected hand behavior
1. Turn teleport ON from watch or desktop `T`.
2. Hold fist or pinch to show the aim ray and target marker.
3. Move/point the hand until the marker is where you want it.
4. Release the gesture to move.
5. If teleport is OFF, hand gesture does not teleport.

## Runtime audit
```js
SVR_RUN_PHASE170_TELEPORT_AUDIT()
```

## Test URL
`/game/?v=phase170-hand-teleport-fix`
