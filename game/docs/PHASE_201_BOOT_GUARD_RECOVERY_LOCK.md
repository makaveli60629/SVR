# PHASE-218-AUTO-APPLY-STATUS-LOCK

## Purpose
Fix game stuck on `Booting…` by moving game startup behind a guarded loader.

## Added
- `game/boot.js` guarded dynamic loader
- Boot recovery overlay if `main.js` import fails or does not send ready signal
- `svr_game_ready` event from `main.js`
- Cache-busting import path for `main.js`
- Enterprise bridge alias fix for `window.SVR_ENTERPRISE_BRIDGE`
- Safe `queue()` / `postTelemetry()` bridge aliases

## Protected
- Public Matrix launch page untouched
- Dealer body remains disabled
- Invisible card/deal logic preserved
- Game package stays under 25 MB

## Test
Open `/game/?v=phase201`. The top status should move from `Boot guard: loading game module…` to scene loading and then ready. If import fails, the user sees a recovery panel instead of being stuck on Booting.
