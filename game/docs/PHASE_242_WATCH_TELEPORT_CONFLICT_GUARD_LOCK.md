# PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK

## Purpose
Phase 242 fixes the reported watch freeze / black-square conflict when teleport is ON and the user looks at or interacts with the watch.

## Direct fixes
- `modules/watch.js`
  - Watch screen material is now double-sided to prevent black backside squares.
  - Adds texture heartbeat so the canvas texture keeps refreshing while teleport/hand state changes.
  - Publishes `window.SVR_WATCH_INTERACTION_STATE`.
  - Preserves Phase 241 upright orientation correction.
- `modules/teleport.js`
  - Hand teleport pauses while the watch is visible and being hovered/touched.
  - Face-toggle/pinch teleport is blocked during active watch interaction.
  - The teleport mode is not destroyed; it resumes after the hand moves away from the watch.
- `modules/watch_teleport_conflict_guard.js`
  - Press F7 to verify live watch/teleport guard state.

## Preserved locks
- Watch upright orientation remains.
- Fire lightning hand glow and arch remain.
- Hand teleport Phase 238/239 behavior remains away from the watch.
- Quest right-stick autocalibration remains.
- Spawn-front chair clear remains.
- Public Matrix launch page untouched.

## Test
Open `/game/?v=phase242-watchtpguard` and press `F7`.
