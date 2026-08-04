# Phase 199 — Grand Atrium Structure Lock

## User directive
Agent mode GitHub. Rebuild the structure first so the game lobby feels like the supplied grand two-floor lobby concept. Store hubs, advertisements, sponsor images, and final detail modules can return after the structure is correct.

## Scope
Game-side only. Site untouched.

## Structural changes
- Rebuilt the active clean lobby builder inside `game/modules/phase195_clean_lobby_world.js` as a grand atrium structure.
- Kept the clean runtime path from Phase 195/198 so the legacy `world_skyline.js` background-building stack remains bypassed.
- Added a curved two-floor colonnade using repeated arch bays.
- Added a continuous upstairs balcony walkway and railing.
- Added balcony guard glass.
- Added lower and upper arch recesses for module bays.
- Added a central `PLAY GAME` table-select structural panel.
- Added placeholder structural panels for:
  - Wellness
  - PGA
  - Legends
  - Sponsors
  - Scorpion
  - Daily Bonus
  - Sponsor Area
  - Tier-1 Jumbotron placeholders
- Added polished floor path and center crest ring.
- Preserved the lower poker table area.
- Preserved one Moon and one Mars.
- Preserved star field only; no background skyline buildings.
- Updated floor authority so Phase 199 grand atrium structures are not hidden as duplicate floors.

## Locked behavior
- Grand two-floor structure is now the active lobby direction.
- Background building skyline remains removed.
- Old octagon/legacy world stack remains bypassed.
- Store hubs and ads are not final yet; current signs are structural placeholders.
- Center remains walkable for VR.
- Teleport, hands/controllers, watch, scene buttons, and store portal remain preserved.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase199-grand-atrium`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-199-GRAND-ATRIUM-STRUCTURE-LOCK`.
- [ ] Confirm curved two-floor atrium structure is visible.
- [ ] Confirm repeated arch bays are visible.
- [ ] Confirm upstairs balcony rail/guard glass is visible.
- [ ] Confirm central Play Game structure is visible.
- [ ] Confirm Wellness, PGA, Sponsor, Scorpion, Jumbotron placeholders are visible.
- [ ] Confirm no legacy background buildings flash or appear.
- [ ] Confirm only one Moon and one Mars.
- [ ] Confirm teleport still works.
- [ ] Confirm `window.SVR_PHASE199_GRAND_ATRIUM.locked === true`.

## Files changed
- `game/modules/phase195_clean_lobby_world.js`
- `game/main.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/modules/phase191_floor_authority_lock.js`
- `game/docs/BUILD_VERSION.json`
