# Phase 92 — Table Scale + NPC Calibration Lock

Game-side only. Site untouched.

## Added

- `game/modules/p92_scale_npc_calibration_lock.js`
- `game/scorpion-table-p92.html`

## Purpose

Quest testing showed the table looked good but still felt physically unclear:

- the table appeared to move with head/view changes
- the player needed fixed reference objects
- chips/cards still needed better measured felt-surface calibration
- the player needed sitting/standing comfort references
- NPCs/chairs were needed to judge table scale

## Corrections

- Creates a new Phase 92 isolated calibration page.
- Keeps the table world-locked.
- Removes repeated camera reseating from the Phase 92 page loop.
- Adds chair references around the table.
- Adds Eric on the far side if `assets/eric.fbx` exists.
- Adds fallback Eric if the FBX is not available.
- Adds side NPC placeholders.
- Adds a vertical measurement ruler.
- Adds a transparent measured inner play-surface reference plane.
- Adds surface up/down controls.
- Adds runtime commands for inch-based surface adjustment.
- Adds dark leather hand-rest reference ring.
- Keeps lighting from the accepted Scorpion test.

## Runtime controls

```js
SVR_RUN_PHASE92_CALIBRATION_AUDIT()
SVR_P92_SURFACE_UP()
SVR_P92_SURFACE_DOWN()
SVR_P92_SET_SURFACE_OFFSET_INCHES(6)
```

## Test URL

`/game/scorpion-table-p92.html?v=phase92-table-scale-npc-calibration-lock`

## Acceptance checks

- Table no longer feels like it follows head movement.
- Player can see chairs and NPCs for scale.
- Eric/fallback Eric appears across the table.
- Vertical ruler shows measurement reference.
- Surface Up/Down changes the felt calibration height.
- Cards/chips snap to the adjusted measured surface.
- Player can determine whether the seat is too high, too low, too close, or too far.

## Next

After Quest confirmation, hard-lock the accepted surface offset and seat values into a reusable Scorpion room route.
