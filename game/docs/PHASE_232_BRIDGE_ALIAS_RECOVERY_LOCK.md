# PHASE-238-HAND-TELEPORT-PINCH-DESTINATION-LOCK

## Purpose
Phase 238 fixes the live Phase 230 boot fallback by adding bridge alias files for stale and current main.js imports.

## Direct fix
- Adds `game/modules/enterprise_bridge_phase229.js`
- Adds `game/modules/enterprise_bridge_phase230.js`
- Adds `game/modules/enterprise_bridge_phase238.js`
- Adds `game/modules/enterprise_bridge_phase238.js`
- Updates `main.js` to import the stable bridge directly.
- Adds `game/modules/bridge_alias_recovery.js`
- Adds F9 alias check panel.

## Why
The live boot report shows `main.js?v=phase230` failed to dynamically import. The committed `main.js` imports `./modules/enterprise_bridge_phase230.js`, but that file was missing on `main`, causing boot fallback.

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase238-bridgealias` and press `F9`.
