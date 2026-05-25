# PHASE-213-BOOT-ROUTE-RECOVERY-LINK-LOCK

Phase 213 aligns the boot script cache marker, main runtime build marker, version.json, and bridge import marker.

## Fixes
- Updates `index.html` script query from stale phase values to `boot.js?v=phase213`.
- Updates `boot.js` fallback/no-cache reload/import query markers to Phase 213.
- Adds `modules/boot_cache_watchdog.js` to detect stale version or boot cache mismatch.
- Adds cache-busted `enterprise_bridge_phase213.js`.
- Keeps public Matrix launch page untouched.

## Test
Open `/game/?v=phase213-bootcache`, then verify the HUD says `PHASE-213-BOOT-ROUTE-RECOVERY-LINK-LOCK` and the game does not remain stuck on Booting.
