# PHASE-212-BOOT-DIAGNOSTIC-SNAPSHOT-LOCK

Phase 212 aligns every visible and machine-readable game marker after the boot-cache work.

## Locked
- Public Matrix launch page untouched.
- Direct `/game` folder deploy remains the source of truth.
- ZIP remains under 25 MB.
- Dealer body remains disabled; invisible deal/card logic preserved.

## Added
- `modules/marker_health.js`
- `window.SVR_MARKER_HEALTH`
- `svr_marker_health_update` event
- Title/HUD/version/deploy-health/boot-query marker checks

## Test
Open `/game/?v=phase212-markerhealth`, then verify:
- the title says Phase 212
- the HUD says `PHASE-212-BOOT-DIAGNOSTIC-SNAPSHOT-LOCK`
- `version.json` reports phase 211
- the game does not return to a stuck Booting screen
