# PHASE-176-TURN-TIMER-TELEMETRY-LOCK

## Purpose
Lock the next playable-poker step without touching the public Matrix launch page.

## Added
- 20-second player action timer windows.
- Auto-check when no bet is facing the player.
- Auto-fold when a call is facing the player and no action is taken.
- Poker telemetry events for player actions and completed hands.
- Runtime enterprise bridge with safe API queueing.
- Cleaned legacy phase documents that reintroduced old sponsor/founder language.

## Protected
- Public Matrix launch page untouched.
- Website root untouched.
- Private scenes stay separate from the lobby.
- No SQL, Stripe, or admin secrets in browser code.
- Game package remains under 25 MB.
