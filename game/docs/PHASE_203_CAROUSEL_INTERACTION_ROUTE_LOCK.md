# Phase 203 — Carousel Interaction Route Lock

## Purpose
Phase 203 makes the Wellness carousel controls functional on top of the Phase 202 storefront shell pass.

## Scope
Game-side only. Site untouched.

## Changes
- Added `game/modules/phase203_carousel_interactions.js`.
- Added `game/phase203_boot.js` as a standalone interaction boot module.
- Updated `game/index.html` to load Phase 203 after the main lobby boot.
- Updated `game/phase176_boot.js`, `game/docs/BUILD_VERSION.json`, and `update/version.json` to Phase 203.

## Functional additions
- Wellness carousel slide switching:
  - Next button advances slides.
  - Back button returns to the prior slide.
- Slide set:
  - Video placeholder
  - About placeholder
  - Symbols placeholder
  - Meditation route slide
- Visible button labels:
  - BACK
  - NEXT
  - ENTER ROOM
- Meditation Room button route:
  - routes to `./reiki.html?v=phase203-meditation-route`
- Desktop pointer interaction:
  - click Next / Back / Enter Room
- XR select interaction:
  - controller select ray can activate action targets
- Additional routed targets:
  - Store opens web store
  - PGA selects PGA bay
  - Scorpion selects Scorpion bay

## Locked behavior
- Uses Phase 202 storefront shells as the base.
- Keeps Phase 200 ordered grand lobby structure.
- Keeps Phase 201 hub content.
- Keeps background buildings disabled.
- Keeps one Moon and one Mars.
- Keeps no black face overlay.
- Keeps no visible hand/controller proxy overlay.
- Keeps approval-safe placeholders only.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase203-carousel-interactions`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-203-CAROUSEL-INTERACTION-ROUTE-LOCK`.
- [ ] Click NEXT on the Wellness carousel and confirm the slide changes.
- [ ] Click BACK and confirm the prior slide returns.
- [ ] Click ENTER ROOM and confirm it routes to the meditation page.
- [ ] In Quest, aim at NEXT / BACK and press select/trigger to confirm the slide changes.
- [ ] Confirm Store target still opens the web store.
- [ ] Confirm PGA and Scorpion targets still route/select their bays.
- [ ] Confirm no old background buildings appear.
- [ ] Confirm no black overlay appears.
- [ ] Confirm teleport still works.
- [ ] Confirm `window.SVR_PHASE203_CAROUSEL_INTERACTIONS.locked === true`.

## Next phase recommendation
Phase 204 should add interaction polish:
1. Dedicated pointer cursor/hover highlight for Quest.
2. Wellness carousel slide content from approved media/content.
3. Private meditation room page polish.
4. Store/PGA/Scorpion button labels and route confirmations.
5. Quest performance check after interactive targets are active.
