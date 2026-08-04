# Update 3.1-C — Moon Phase Hard Lock

## Build label
`UPDATE-3.1-C-MOON-PHASE-HARD-LOCK`

## Scope
Game-side only. Website untouched.

## Problem fixed
The lobby was showing multiple Moon objects and the diagnostics/build label was drifting between older 3.0 phases and the new 3.1 phases.

## Runtime module
- `game/update31_moon_phase_hard_lock.js`

## Attachment path
- `game/phase176_boot.js` imports `game/update31_version_sync_lock.js`.
- `game/update31_version_sync_lock.js` dynamically loads:
  - `game/update31_lobby_structure_completion.js`
  - `game/update31_moon_phase_hard_lock.js`

## What changed
- Removes every extra Moon mesh from old phase modules.
- Keeps one Moon only:
  - `UPDATE31C_ONLY_SKY_MOON_LEFT_EYE_CANDY`
- Places that Moon high and left of center.
- Keeps Moon texture/crater look.
- Repeatedly enforces the `UPDATE-3.1-C-MOON-PHASE-HARD-LOCK` label.
- Updates diagnostics to show 3.1-C.
- Updates build/deploy version files.

## Test checklist
- Load `/game/?v=update31-c-moon-phase-hard-lock`.
- Hard refresh.
- Confirm there is only one Moon.
- Confirm no Moon/dome is on the floor.
- Confirm the diagnostic panel says `UPDATE-3.1-C-MOON-PHASE-HARD-LOCK`.
- Confirm red carpet from 3.1-B is still visible.
- Confirm city windows / spawn seal remain.

## Next phase
Update 3.1-D — Module Routing Audit
