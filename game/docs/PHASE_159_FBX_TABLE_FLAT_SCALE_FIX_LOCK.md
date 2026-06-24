# Phase 159 — FBX Table Flat Scale Fix Lock

## Scope

Targeted game-side fix for the uploaded poker table FBX.

## Issue observed

The uploaded table imported upright like a wall/cylinder and covered the lobby. The table was also scaled from the wrong axis, causing it to tower over the stools and block the room.

## Fixes

- Added multi-orientation testing for the FBX table import.
- Chooses the most table-like orientation by checking footprint, height ratio, and target table aspect.
- Forces the long axis to align with the stool/table footprint.
- Scales the table to fit inside the six-stool ring.
- Reduces the target footprint so it does not cover the lobby.
- Removes/hides old procedural and geometric table fallback roots.
- Preserves stool guides as the sizing reference.
- Preserves poker logic, seats, buttons, and lobby safety modules.
- Does not touch the website/site.

## Runtime globals

```js
window.SVR_PHASE159_FBX_TABLE_FLAT_SCALE_FIX_LOCK
window.SVR_RUN_PHASE159_TABLE_AUDIT()
```

Expected audit:

```text
actualFbxPreferred: true
actualFbxLoaded: true
oldWallTableRemoved: true
geometricFallbackTablesRemoved: true
noBlink: true
stoolsPreserved: true
siteTouched: false
```

## Test URL

```text
https://svrpoker.com/game/?v=phase159-table-flat-scale-fix
```

## Protected

- Do not re-enable Phase 156 procedural table.
- Do not re-enable Phase 157/158 wall/upright table behavior.
- Keep the table scaled from the stool ring.
- Keep site untouched.
