# Phase 306 Scorpion Action HUD Lock

Build: `PHASE-306-SCORPION-ACTION-HUD-LOCK`

## Summary

Phase 306 is game-side only. The public root page remains locked and untouched.

## Fix

Adds a Scorpion player action HUD after seat reservation and seat snap.

## Controls

```text
F = Fold
C = Check / Call
R = Raise
A = All-In
H = Next Hand
```

## Behavior

- Listens for `svr-scorpion-seat-snap-complete` and `svr-scorpion-seat-reserved`.
- Shows a readable action panel near the Scorpion table route area.
- Adds pointer/touch action pads for later VR ray/watch routing.
- Dispatches `svr-scorpion-player-action`.
- Dispatches `svr-poker-player-action` for compatibility with poker modules.
- Marks actions as play-money demo controls only.

## Runtime globals

```text
window.SVR_PHASE306_SCORPION_ACTION_HUD_LOCK
window.SVR_PHASE306_LAST_SCORPION_ACTION
```

## Files changed

```text
game/phase306_scorpion_action_hud_lock.js
game/phase305_scorpion_reserved_seat_snap_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase306-scorpion-action-hud
```
