# Phase 102 — Desktop Hub Position Table

## Scope
Game/WebXR only. Website/site remains locked and untouched.

## Added
- `game/modules/hub_position_table.js`
- Desktop overlay showing:
  - current player/camera X/Y/Z position
  - facing direction
  - nearest portal
  - portal/object coordinate table
- Copy button for exact placement notes.
- Press `P` to hide/show the overlay.

## Use case
Walk around the lobby on desktop and copy a placement note like:

```text
PLACE PORTAL HERE: X -7.35, Y 1.62, Z -2.65 | Facing North / back 180°
```

Then provide that note for portal placement.

## Preservation rule
The locked fist/pinch teleport release behavior from Phase 101 remains untouched.

## Test
Open:

```text
https://svrpoker.com/game/?v=phase102-hub-position-table
```

Verify:

- Position table appears on the upper-right desktop screen.
- X/Y/Z changes as you walk.
- Press `P` to hide/show.
- Copy button copies a placement note.
