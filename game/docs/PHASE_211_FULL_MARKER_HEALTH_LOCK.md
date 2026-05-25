# PHASE-219-AUTO-APPLY-VERIFY-LOCK

Phase 213 aligns every visible and machine-readable game marker after the boot-cache work.

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
Open `/game/?v=phase219-markerhealth`, then verify:
- the title says Phase 213
- the HUD says `PHASE-219-AUTO-APPLY-VERIFY-LOCK`
- `version.json` reports phase 211
- the game does not return to a stuck Booting screen
