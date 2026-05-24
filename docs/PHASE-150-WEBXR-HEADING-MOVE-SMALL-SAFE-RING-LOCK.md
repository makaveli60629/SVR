# PHASE-150-WEBXR-HEADING-MOVE-SMALL-SAFE-RING-LOCK

## Purpose

Phase 150 fixes the issue reported after Phase 149: after a 45-degree snap turn, pressing forward could move sideways/right. Phase 150 also reduces the table safe ring lock strength so the teleport halo does not over-lock to the table center.

## Files changed

- `game/index.html`
- `game/modules/phase150_webxr_heading_safe_ring.js`
- `docs/PHASE-150-WEBXR-HEADING-MOVE-SMALL-SAFE-RING-LOCK.md`
- `update/version.json`

## Movement fixes

- Uses one best stick axis pair at a time.
- Prevents mixed X/Y axes from different gamepad axis pairs.
- Right stick left/right still 45-degree snap-turns.
- Right stick up/down moves forward/back using the current headset heading after snap-turn.
- Left/right strafe remains disabled in this diagnostic base.

## Table safe ring changes

- Reduced the table blocked radius from 3.55 to 2.65.
- Reduced the safe target radius from 4.35 to 3.35.
- The halo still avoids the table center, but it should not over-lock as aggressively.
- This keeps the portal/safe-ring concept available without making the table magnet too strong.

## Uploaded hand/glove asset review

The user supplied:

- `workGloves.zip`
- `hand.zip`

Inspection summary:

- Work gloves contain a large OBJ and a JPG texture.
- Hand asset contains large OBJ/STL geometry.
- These should not be pushed directly into the live Quest runtime yet because they are too heavy for the currently fragile WebXR performance path.
- Next hand phase should use optimized converted GLB assets or a procedural/low-poly hand proxy first.

## Next phase

`PHASE-151-HANDS-FIST-PURPLE-FIRE-ON-WORKING-DOLLY-BASE`

Rules for Phase 151:

- Do not change the Phase 150 dolly teleport base.
- Add visible hands as a separate removable module.
- Fist gesture should show purple fire.
- Fist should reveal the halo.
- Release should follow the proven WebXR dolly movement path.
- Keep controller fallback available.
- Keep music off.
