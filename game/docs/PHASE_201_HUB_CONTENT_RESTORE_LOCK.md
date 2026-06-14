# Phase 201 — Hub Content Restore Lock

## Purpose
After Phase 200 ordered the grand two-floor structure, Phase 201 starts putting the lobby content back in a controlled way. This phase does not bring back old skyline/building stacks or unstable overlays. It layers readable module content on the approved structure.

## Scope
Game-side only. Site untouched.

## Changes
- Added `game/modules/phase201_hub_content_restore.js`.
- Wired Phase 201 into `game/main.js` after the Phase 200 world builder loads.
- Updated `game/index.html`, `game/phase176_boot.js`, `game/docs/BUILD_VERSION.json`, and `update/version.json` to Phase 201.

## Restored content
- Main SVR Grand Lobby header.
- Wellness / Reiki content panel.
- PGA Training content panel.
- Play Game content panel.
- SVR Store content panel.
- Scorpion content panel.
- Tier 1 left and right jumbotron ad slots.
- Daily Bonus kiosk panel.
- Sponsor Area kiosk panel.
- Kiosk pedestal bases.
- Floor direction arrows.
- Rope guide lines around the center and hub areas.
- Extra warm/cyan accent lighting.

## Approval safety
- Wellness/Reiki content is marked `WAITING FOR APPROVAL`.
- No external founder names, unapproved photos, external logos, or unapproved sponsor URLs were added in this phase.
- The actual sponsor creative/media can be layered after visual verification.

## Locked behavior
- Uses Phase 200 ordered structure as the base.
- Keeps legacy background buildings disabled.
- Keeps one Moon and one Mars.
- Keeps no black face overlay.
- Keeps no visible hand/controller proxy overlay.
- Keeps teleport, watch, desktop controls, Android smart controls, scene buttons, and store portal.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase201-hub-content`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-201-HUB-CONTENT-RESTORE-LOCK`.
- [ ] Confirm the ordered two-floor structure still appears.
- [ ] Confirm module panels are readable.
- [ ] Confirm jumbotron ad slots are visible on side walls.
- [ ] Confirm floor arrows and rope guides are visible but not blocking movement.
- [ ] Confirm no old skyline/background buildings appear.
- [ ] Confirm no black face overlay.
- [ ] Confirm no visible proxy object in the hands.
- [ ] Confirm teleport still works.
- [ ] Confirm `window.SVR_PHASE201_HUB_CONTENT_RESTORE.locked === true`.

## Next phase recommendation
Phase 202 should restore final visual polish in this order:
1. Storefront exterior shells for SVR Store, Wellness, PGA, and Scorpion.
2. Hologram/carousel frame placeholders.
3. Approved ad creative only.
4. Final lighting/material pass.
5. Quest performance check.
