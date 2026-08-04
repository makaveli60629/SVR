# Phase 189 — Spawn Height Stability Lock

## Scope
Game-side only. No website or site edits.

## Problem observed
Desktop spawn was raising and falling without movement.

## Cause
The consolidated balcony height logic treated the ground spawn position near the south perimeter as if the player was already standing on the second-floor balcony. This caused automatic lift to second-floor height, then other controls corrected back down, creating a vertical bounce.

## Fix
- Keeps ground spawn at ground height.
- Adds floor-aware height logic.
- Does not auto-lift onto the perimeter balcony just because the player is under its X/Z footprint.
- Only raises height when the player is on the curved stair path or is already on the upper level.
- Keeps the consolidated architecture module active as the single authority.
- Cache-busts boot to Phase 189.

## Runtime audit
```js
SVR_RUN_PHASE189_HEIGHT_AUDIT()
SVR_RUN_PHASE188_ARCHITECTURE_AUDIT()
```

## Test URL
`/game/?v=phase189-spawn-height-stability`

## QA checklist
- Desktop spawn should stay at normal eye height.
- No automatic lift at spawn.
- No up/down bounce before movement.
- Curved stairs should still raise height while walking up them.
- Upper balcony should keep second-floor height after reaching it through stairs.
