# Phase 182 — Expanded Original Wall Lock

## Scope
Game-side only. Site untouched.

## Fix
- Removed the visible octagon lobby shell by replacing the Phase 168 octagon installer with a backwards-compatible expanded rectangular/original-wall installer.
- Hidden Phase 168/169/173 octagon wall objects if older modules race during boot.
- Hidden Phase 176 arena/jumbotron shell so it does not collapse the lobby into a central octagon-style arena.
- Expanded movement bounds from octagon/apothem bounds to a large rectangular lobby boundary.
- Updated visible build label to `UPDATE-3.0-PHASE-182-EXPANDED-ORIGINAL-WALL-LOCK`.

## Locked behavior
- Lobby uses the expanded original-style rectangular room wall.
- No octagon shell wall should remain visible.
- Wall surfaces sit at north/south/east/west and leave the middle floor open.
- Storefront portals remain modular and wall-aligned.
- Poker table, watch, controller fallback, teleport, and existing scene buttons are preserved.

## Files changed
- `game/index.html`
- `game/phase176_boot.js`
- `game/modules/lobby_octagon_phase168.js`
- `game/modules/phase178_bounds.js`
