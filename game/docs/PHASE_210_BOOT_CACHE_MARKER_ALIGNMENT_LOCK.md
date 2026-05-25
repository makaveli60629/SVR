# PHASE-210-BOOT-CACHE-MARKER-ALIGNMENT-LOCK

Phase 210 aligns the boot script cache marker, main runtime build marker, version.json, and bridge import marker.

## Fixes
- Updates `index.html` script query from stale phase values to `boot.js?v=phase210`.
- Updates `boot.js` fallback/no-cache reload/import query markers to Phase 210.
- Adds `modules/boot_cache_watchdog.js` to detect stale version or boot cache mismatch.
- Adds cache-busted `enterprise_bridge_phase210.js`.
- Keeps public Matrix launch page untouched.

## Test
Open `/game/?v=phase210-bootcache`, then verify the HUD says `PHASE-210-BOOT-CACHE-MARKER-ALIGNMENT-LOCK` and the game does not remain stuck on Booting.
