# Phase 88 — Isolated Scorpion Table Test

Game-side only. Site untouched.

## Added

- `game/scorpion-table-test.html`

## Purpose

This page isolates the poker table from the main lobby boot so table geometry and poker logic can be tested without inherited lobby movement, portal, or seat-authority conflicts.

## What loads

- Standalone WebXR / Three.js scene
- Scorpion-style room shell
- Real table asset from `game/assets/table.fbx`
- Fallback procedural table only if the FBX asset fails
- Seat calibration buttons
- Position HUD
- Phase 85 poker truth logic

## What does not load

- Main lobby module stack
- Lobby portal routing
- Older table-seat override layers
- Hand travel modules
- Movement modules

## Test URL

`/game/scorpion-table-test.html?v=phase88-isolated-scorpion-table-test`

## Runtime checks

```js
SVR_RUN_PHASE85_POKER_AUDIT()
SVR_POKER_NEXT_HAND()
window.SVR_SCORPION_SEAT
```

## Acceptance checks

- Page opens directly into a Scorpion-style room.
- Real table appears centered.
- Player sits directly at the front edge of the table.
- Closer / Back / Up / Down buttons adjust the seat.
- Poker HUD appears.
- Cards/chips/pot overlays appear on the table.
- No main lobby movement stack is active on this page.

## Next

Once this page feels correct in Quest, copy the accepted seat geometry into the main Scorpion room route.
