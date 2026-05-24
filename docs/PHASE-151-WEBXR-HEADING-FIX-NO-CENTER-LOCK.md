# PHASE-151-WEBXR-HEADING-FIX-NO-CENTER-LOCK

## Purpose

Fix the reported sideways movement after a 45-degree snap turn and stop the teleport target from sticking to the table center.

## Files changed

- `game/index.html`
- `game/modules/phase151_webxr_heading_no_center_lock.js`
- `docs/PHASE-151-WEBXR-HEADING-FIX-NO-CENTER-LOCK.md`

## Movement fix

- Forward/back movement now uses explicit dolly yaw after snap-turn.
- Right stick left/right remains 45-degree snap-turn.
- Right stick up/down remains forward/back.

## Table center fix

- The table center is now blocked instead of magnet locked.
- When the ray hits the blocked center area, the target hides and cannot teleport.
- Aim outside the ring to show the target again.

## Test URL

```text
https://svrpoker.com/game/?v=phase151-heading-no-center-lock
```

## Next

If this passes, add visible hands and fist purple-fire as a separate removable module.
