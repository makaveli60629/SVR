# PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK

## Purpose
Adds a boot diagnostic snapshot layer so testing can capture exact evidence for boot/import/CDN/cache/deploy mismatches instead of relying on screenshots alone.

## Added
- `game/modules/boot_diagnostic_snapshot.js`
- `window.SVR_BOOT_DIAGNOSTIC`
- Keyboard shortcut: `D`
- Browser event: `svr_boot_diagnostic_snapshot`

## Checks captured
- runtime build marker
- page title and HUD marker
- script query markers
- `version.json`
- `deploy-health.json`
- `game/deploy-health.json`
- boot guard state
- boot fallback state
- marker health state
- bridge proxy/selftest/event bus presence
- recent runtime errors

## Lock rules preserved
- Public Matrix launch page untouched.
- Dealer body disabled.
- Invisible card/deal logic preserved.
- Game package under 25 MB.
