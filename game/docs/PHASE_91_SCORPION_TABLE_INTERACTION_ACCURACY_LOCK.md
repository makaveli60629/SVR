# Phase 91 — Scorpion Table Interaction Accuracy Lock

Game-side only. Site untouched.

## Added

- `game/modules/p91_interaction_accuracy_lock.js`
- `game/scorpion-table-p91.html`

## Why a new page was created

The connector blocked a direct overwrite of the existing Phase 90 Scorpion table page. To avoid disrupting the accepted Phase 90 page, Phase 91 was created as a separate isolated test page.

## Purpose

Phase 91 improves table interaction feel after Phase 90 visual polish.

## Improvements

- Adds precision selection logic for cards/chips.
- Adds ray and near-object picking.
- Adds visible grab highlight.
- Adds chip stack snap zones.
- Adds board/player card snap zones.
- Adds release snap correction.
- Adds audit HUD values:
  - hovered object
  - held object
  - last released object
  - last snap zone
- Keeps the Phase 90 lower play surface and polish stack.
- Keeps the accepted seat/view.

## Runtime checks

```js
SVR_RUN_PHASE91_INTERACTION_AUDIT()
SVR_RUN_PHASE90_SURFACE_AUDIT()
SVR_RUN_PHASE89_SURFACE_AUDIT()
SVR_RUN_PHASE85_POKER_AUDIT()
```

## Test URL

`/game/scorpion-table-p91.html?v=phase91-interaction-accuracy-lock`

## Acceptance checks

- Hover highlight appears over a card/chip.
- Select/press near a card/chip attaches it.
- Releasing snaps chips to stack zones or table surface.
- Releasing cards snaps to board/player zones or table surface.
- HUD shows hover/held/release/snap values.
- Seat position remains accepted from prior Quest test.
