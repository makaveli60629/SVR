# PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK

## Purpose
Phase 244 fixes the Quest runtime error in `game/main.js`.

## Root cause found
`main.js` animation-loop catch block referenced `PHASE.build`, but `PHASE` is not defined in `main.js`. When a Quest runtime error occurred, the catch block itself threw another error and could freeze WebXR.

## Direct fixes
- Adds `BUILD_LABEL` and `BUILD_PHASE` constants in `main.js`.
- Replaces the broken `PHASE.build` reference.
- Adds `window.SVR_MAIN_RUNTIME_STATE`.
- Makes the animation-loop catch Quest-safe:
  - logs the error
  - dispatches `svr_main_runtime_error`
  - uses crash shield when available
  - does not rethrow into WebXR
- Adds null-safe HUD button handlers.
- Adds `game/modules/main_runtime_catch_fix.js`.
- Keeps Phase 243 deploy sync force marker so stale Phase 238 live cache can be detected.

## Preserved locks
- Watch teleport conflict guard remains.
- Watch upright correction remains.
- Fire lightning arch and hands remain.
- Hand teleport behavior remains.
- Quest right-stick autocalibration remains.
- Spawn-front chair clear remains.
- Public Matrix launch page untouched.

## Test
Open `/game/?v=phase252-mainruntime` and press `F9`.
