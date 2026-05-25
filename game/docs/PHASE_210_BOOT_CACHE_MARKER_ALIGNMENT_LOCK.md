# PHASE-234-POWER-DEPLOY-SMOKE-PROBE-LOCK

Phase 213 aligns the boot script cache marker, main runtime build marker, version.json, and bridge import marker.

## Fixes
- Updates `index.html` script query from stale phase values to `boot.js?v=phase234`.
- Updates `boot.js` fallback/no-cache reload/import query markers to Phase 213.
- Adds `modules/boot_cache_watchdog.js` to detect stale version or boot cache mismatch.
- Adds cache-busted `enterprise_bridge_phase234.js`.
- Keeps public Matrix launch page untouched.

## Test
Open `/game/?v=phase234-bootcache`, then verify the HUD says `PHASE-234-POWER-DEPLOY-SMOKE-PROBE-LOCK` and the game does not remain stuck on Booting.
