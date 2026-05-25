# Phase 189 — Runtime QA Snapshot Lock

## Scope
Game-side poker UX lock. Public Matrix launch page remains untouched.

## Added
- Watch sync for player turn state.
- Watch displays actor, street, countdown, call/check amount, pressure, and pot-odds percentage.
- Watch CALL button dynamically changes to CHECK when no bet is facing the player.
- Watch RAISE button displays minimum raise sizing.
- Watch NEXT HAND button added for faster testing.
- Runtime event bridge listens to legal-action, decision-aid, turn-indicator, all-in, and side-pot events.

## Preserve
- Dealer body disabled; invisible card/deal logic remains.
- Private scenes stay separate routes.
- Unapproved wellness/founder branding remains removed.
- Game package stays under 25 MB.
