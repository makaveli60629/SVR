# PHASE-138-WATCH-UI-INPUT-BRIDGE-LOCK

## Purpose

Phase 138 upgrades the SVR forearm watch into the main in-game input bridge for SVR-Version 0.1. The watch must support navigation, teleport state, table seating, music controls, and future account/admin/sponsor readiness without breaking the locked watch placement.

## Files changed

- `game/modules/watch.js`
- `docs/PHASE-138-WATCH-UI-INPUT-BRIDGE-LOCK.md`
- `update/version.json`

## Watch UI changes

The watch now shows a denser VR-friendly button grid:

- Teleport
- Lobby
- Scorpion
- Sit / Leave
- Reiki
- PGA Drive
- Store
- Lounge
- Sponsor
- Music
- Next Track
- Chip/Putt

## Input bridge rules

- Pinch button to press.
- Fist toggles teleport through the teleport module.
- Trigger release teleport remains handled by Phase 137 teleport module.
- Watch teleport button still calls `actions.toggleTeleport`.
- Watch route buttons call the matching route functions from `main.js`.

## Performance rules

- Watch pose math now reuses vectors/quaternions instead of allocating new vectors every frame.
- Tip hit testing reuses vector state.
- Buttons are rebuilt in a cache array instead of allocating unnecessary persistent objects outside draw/hit work.
- Canvas only updates when state signature changes.

## Locked placement

The watch remains attached to the forearm and keeps the screen facing the user. Do not move it back to floating HUD unless explicitly requested.

## Runtime global

- `window.SVR_WATCH_ALIGNMENT_LOCK.phase = PHASE-138-WATCH-UI-INPUT-BRIDGE-LOCK`

## Test URL

```text
https://svrpoker.com/game/?v=phase138-watch-input
```

Hard refresh:

```text
Ctrl + F5
```

## Quest test checklist

- Watch appears on hand/forearm when hand tracking is available.
- Watch is readable.
- Teleport button toggles teleport mode.
- Lobby button routes to safe lobby position.
- Scorpion button routes to Scorpion portal area.
- Reiki, PGA Drive, Store, Lounge, Sponsor buttons route to their portal areas.
- Sit/Leave button still changes table state.
- Watch does not cause severe frame stutters.

## Next phase

`PHASE-139-POKER-GAMEPLAY-TABLE-STATE-LOCK`

Target: lock Texas Hold'em state, left-to-right dealing, action timer, auto-check/fold, call staging, pot banner, winner display, and hand history strip.
