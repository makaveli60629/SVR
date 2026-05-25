# PHASE-211-FULL-MARKER-HEALTH-LOCK

## Purpose
Prevent SVR custom-event listener errors from freezing the game.

## Added
- `game/modules/safe_event_bus.js`
- `game/modules/enterprise_bridge_phase211.js`
- `svr_safe_event_bus_error` telemetry event

## Locked protections
- Public Matrix launch page untouched
- Dealer body disabled
- Invisible card/deal logic preserved
- Package remains under 25 MB
