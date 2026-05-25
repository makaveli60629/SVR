# PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK

## Purpose
Phase 242 hardens boot by removing optional QA/telemetry panel modules from the static `main.js` import chain.

## Direct fix
- Adds `game/modules/optional_module_loader.js`
- `main.js` now statically imports only critical gameplay dependencies and the optional loader.
- Optional panels/telemetry modules load dynamically with `try/catch`, so a missing module no longer prevents `main.js` from importing.
- Keeps bridge aliases for phases 229-233.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase242-optionalloader` and press `F10`.
