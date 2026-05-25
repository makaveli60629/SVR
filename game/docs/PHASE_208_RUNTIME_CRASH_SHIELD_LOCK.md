# PHASE-211-FULL-MARKER-HEALTH-LOCK

## Purpose
Prevent runtime/event bridge failures from freezing the game loop.

## Added
- `game/modules/runtime_crash_shield.js`
- Animation-loop try/catch guard in `main.js`
- Cache-busted enterprise bridge import for Phase 208
- Runtime crash shield browser events and backend starter route

## Locked
- Public Matrix launch page untouched.
- Dealer body disabled.
- Invisible card/deal logic preserved.
- Package remains under 25 MB.
