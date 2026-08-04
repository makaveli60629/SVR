# Phase 191 — Duplicate Floor Authority Lock

## Source issue
GitHub issue #95: `[launch-blocker][vr] Fix duplicate floor system`

## Scope
Game-side only. Site untouched.

## Fix
- Added `game/modules/phase191_floor_authority_lock.js`.
- Enforces `PHASE185_OFFICIAL_POLISHED_MARBLE_FLOOR` as the single authoritative visual floor.
- Marks collision authority as mathematical Y=0 / reference-space only.
- Marks teleport authority as ray-to-Y=0 plus `constrainLobbyBounds`.
- Hides duplicate floor-like meshes, old recessed stage floors, upper walkway rings, Phase188 second-floor systems, and Phase189 duplicate sky-floor decks.
- Updated `phase189_sky_floor_hardlock.js` so it no longer creates a second floor/deck. It now owns sky cleanup and Moon/Mars only.
- Removed Phase188 second-floor installer from the boot chain.
- Preserved Phase 190 Quest controller teleport forward fix.

## Locked behavior
- One visual floor.
- No duplicate lower floor.
- No duplicate sky/second floor deck.
- No collision or teleport authority tied to decorative floor meshes.
- Teleport uses Y=0 ray target plus lobby bounds.
- Floor pulse/debug effects must not affect collision or teleport.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase191-floor-authority`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-191-DUPLICATE-FLOOR-AUTHORITY-LOCK`.
- [ ] Confirm no duplicate upper/sky floor appears.
- [ ] Confirm player does not sink, float, or fall through.
- [ ] Confirm teleport marker lands on the floor.
- [ ] Confirm Quest controller teleport forward behavior from Phase 190 still works.
- [ ] In console, confirm `window.SVR_PHASE191_FLOOR_AUTHORITY.locked === true`.

## Files changed
- `game/modules/phase191_floor_authority_lock.js`
- `game/modules/phase189_sky_floor_hardlock.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
