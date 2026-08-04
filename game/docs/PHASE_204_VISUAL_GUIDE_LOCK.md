# Phase 204 — Visual Guide Lock

## Purpose
Phase 204 adds clear presentation/test guidance labels on top of the Phase 203 carousel interaction pass.

## Scope
Game-side only. Site untouched.

## Changes
- Added `game/phase204_boot.js`.
- Updated `game/index.html` to load Phase 204 after Phase 203.
- Updated `game/phase176_boot.js`, `game/docs/BUILD_VERSION.json`, and `update/version.json` to Phase 204.

## Added visual guides
- BACK label above the carousel back control.
- NEXT label above the carousel next control.
- ENTER ROOM label above the meditation-room route control.
- STORE label at the store shell.
- PGA label at the PGA shell.
- SCORPION label at the Scorpion shell.

## Locked behavior
- Uses Phase 200 ordered grand structure.
- Keeps Phase 201 hub content.
- Keeps Phase 202 storefront shells.
- Keeps Phase 203 carousel interaction logic.
- Keeps background buildings disabled.
- Keeps no black face overlay.
- Keeps no visible hand/controller proxy overlay.
- Keeps approval-safe placeholders only.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase204-visual-guide`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-204-VISUAL-GUIDE-LOCK`.
- [ ] Confirm BACK / NEXT / ENTER ROOM labels are visible near Wellness carousel controls.
- [ ] Confirm STORE / PGA / SCORPION labels are visible near their shell areas.
- [ ] Confirm labels face the camera as the player moves.
- [ ] Confirm Phase 203 Next / Back still changes slides.
- [ ] Confirm Enter Room still routes to the meditation page.
- [ ] Confirm no background buildings appear.
- [ ] Confirm no black overlay appears.
- [ ] Confirm teleport still works.
- [ ] Confirm `window.SVR_PHASE204_VISUAL_GUIDE.locked === true`.

## Next phase recommendation
Phase 205 should polish private meditation room and add a better Wellness presentation page, still approval-safe until final content is approved.
