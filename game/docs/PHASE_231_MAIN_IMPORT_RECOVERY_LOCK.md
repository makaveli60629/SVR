# PHASE-231-MAIN-IMPORT-RECOVERY-LOCK

## Purpose
Phase 231 fixes the boot fallback shown when `main.js` failed to dynamically import because the cache-busted enterprise bridge module for the current phase was missing.

## Direct fix
- Adds `game/modules/enterprise_bridge_phase231.js`
- Updates `main.js` to import `enterprise_bridge_phase231.js`
- Adds `game/modules/main_import_recovery.js`
- Adds F8 import check panel

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase231-importfix` and press `F8`.
