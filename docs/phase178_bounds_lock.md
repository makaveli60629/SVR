# Phase 178 Bounds Lock

## Purpose

Lock movement inside the lobby play area so the player cannot move or teleport outside the octagon.

## Added

- game/modules/phase178_bounds.js

## Updated

- game/modules/teleport.js
- game/phase176_boot.js

## What it does

- Adds an octagon boundary clamp.
- Desktop camera is pushed back inside the safe lobby area.
- Quest controller walking is clamped inside the same area.
- Hand teleport target is clamped inside the same area.
- Controller teleport target is clamped inside the same area.
- Teleport landing is clamped inside the same area.

## Runtime markers

- window.SVR_PHASE178_BOUNDS
- window.SVR_PHASE178_TELEPORT_BOUNDS
- window.SVR_CONSTRAIN_LOBBY_BOUNDS

## Test checklist

1. Try walking through each octagon side on desktop.
2. Try teleporting beyond each octagon side on Quest.
3. Try controller walking into each wall.
4. Try diagonal corners of the octagon.
5. Confirm the player is pushed or clamped back inside.
6. Confirm table, jumbotrons, sponsor screens, and storefronts remain visible.

## Commits

- 55a3ac127a41b82e252eb0263323f448538ff35e
- 2d6786a3f5325b7749b67b86d08d3116dac30264
- 3e00737ef56bffa9240d5cde0ee5ece1be9a3ad4
