# PHASE-207-BRIDGE-PROXY-RUNTIME-LOCK

## Purpose
Phase 206 adds a bridge self-test/autorepair layer after the Phase 205 recorder cache-bust fix.

## Locked fixes
- Adds `game/modules/bridge_selftest.js`.
- Imports the bridge self-test after `enterprise_bridge_phase206.js`.
- Verifies every required bridge recorder alias at startup, game-ready, and key poker telemetry events.
- Patches missing aliases in memory instead of allowing a TypeError to crash the render loop.
- Emits `svr_bridge_selftest_update` for QA/admin telemetry.

## Protected
- Public Matrix launch page untouched.
- Dealer body remains disabled.
- Invisible card/deal logic preserved.
- No API keys, SQL strings, Stripe secrets, or passwords in browser code.
