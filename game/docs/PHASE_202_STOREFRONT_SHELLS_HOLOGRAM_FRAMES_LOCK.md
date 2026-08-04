# Phase 202 — Storefront Shells + Hologram Frames Lock

## Purpose
Phase 202 layers the next visible polish pass onto the ordered Phase 200/201 lobby. This restores storefront shells and presentation frames without bringing back old unstable geometry, blinking skyline buildings, or unapproved external sponsor assets.

## Scope
Game-side only. Site untouched.

## Changes
- Added `game/modules/phase202_storefront_shells.js`.
- Wired Phase 202 into `game/main.js` after Phase 201 loads.
- Updated `game/index.html`, `game/phase176_boot.js`, `game/modules/phase191_floor_authority_lock.js`, `game/docs/BUILD_VERSION.json`, and `update/version.json`.

## Restored / added
- Wellness storefront shell.
- Wellness hologram carousel frame.
- Carousel visual controls:
  - Back
  - Next
  - Meditation room portal button
- PGA storefront shell.
- PGA practice preview target frame.
- Play Game storefront shell.
- SVR Store storefront shell.
- Store display racks / product plinth placeholders.
- Scorpion storefront shell.
- Scorpion private door frame.
- Left and right jumbotron shell frames.
- Entry pads, glass fronts, neon trims, bay counters, and accent lights.

## Approval safety
- Wellness/Reiki remains marked as waiting/approval-safe.
- No unapproved outside names.
- No unapproved founder photos.
- No unapproved external logos.
- No unapproved sponsor URLs.
- Final real media can be inserted after visual verification and approval.

## Locked behavior
- Uses Phase 200 ordered grand lobby structure as base.
- Keeps Phase 201 hub content active.
- Keeps legacy background buildings disabled.
- Keeps one Moon and one Mars.
- Keeps no black face overlay.
- Keeps no visible hand/controller proxy overlay.
- Keeps teleport, watch, desktop controls, Android smart controls, scene buttons, and store portal.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase202-storefront-shells`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-202-STOREFRONT-SHELLS-HOLOGRAM-FRAMES-LOCK`.
- [ ] Confirm storefront shells are visible across rear module bays.
- [ ] Confirm Wellness hologram carousel frame is visible.
- [ ] Confirm PGA practice preview frame is visible.
- [ ] Confirm Store display racks are visible.
- [ ] Confirm Scorpion private door frame is visible.
- [ ] Confirm jumbotron shell frames are visible on side walls.
- [ ] Confirm no legacy background buildings flash in.
- [ ] Confirm no black overlay in the headset.
- [ ] Confirm no visible hand proxy object.
- [ ] Confirm teleport still works.
- [ ] Confirm `window.SVR_PHASE202_STOREFRONT_SHELLS.locked === true`.

## Next phase recommendation
Phase 203 should focus on interaction polish:
1. Make Wellness carousel buttons switch slides.
2. Route Meditation button to the private meditation room.
3. Add click/raycast interaction to PGA, Store, Scorpion shell buttons.
4. Add Quest-only interaction debug labels that hide by default.
5. Keep final sponsor media placeholder-only until approved.
