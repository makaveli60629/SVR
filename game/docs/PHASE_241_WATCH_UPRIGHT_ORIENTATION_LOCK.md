# PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK

## Purpose
Phase 244 fixes the reported upside-down wrist watch.

## Direct fix
- `modules/watch.js`
  - Adds camera-up auto-roll correction.
  - If the watch local up vector is upside down relative to the active camera, it rolls the watch 180 degrees around the screen normal.
  - The screen still faces the player/camera.
  - Button hit testing remains aligned because the full watch group orientation is corrected.
  - Publishes `window.SVR_WATCH_UPRIGHT_STATE`.
- `modules/watch_upright_orientation_panel.js`
  - Press F6 to verify watch orientation state.

## Preserved locks
- Fire lightning hand glow and arch remain.
- Hand teleport Phase 238/239 behavior remains.
- Quest right-stick autocalibration remains.
- Spawn-front chair clear remains.
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase252-watchupright` and press `F6`.
