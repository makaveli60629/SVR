# Phase 341 — Canonical Table Geometry and Card Motion Lock

## Build
`PHASE-341-CANONICAL-TABLE-GEOMETRY-CARD-MOTION-LOCK`

## Canonical table layout
- One uploaded FBX table remains the sole table body.
- Felt is detected from mesh/material geometry.
- Deep casino-green felt, dark rail, and metallic trim are normalized without replacing the model.
- One table-local coordinate model drives seats, cards, burn pile, muck, pass line, and logo.
- Open player seat remains south/front.
- Center logo width is 22% of playable felt width.
- Pass-line inset is 0.0508 m with separate white and gold strokes.

## Card authority
- One reusable card pool: 12 hole cards, 5 community cards, and 3 burn cards.
- Old Phase 85, Phase 326, and Phase 334 card planes are suppressed.
- Two left-to-right dealing rounds use the Phase 336 dealer position.
- Burn cards animate before flop, turn, and river.
- Community cards animate to canonical slots.
- Folded cards animate into the muck.
- Live showdown hands flip face up.
- Android DOM cards display the same Phase 336 player hand.

## Android action authority
- Existing single MOVE and LOOK controls are preserved.
- The six-button rail becomes NEXT/FOLD, SIT, CHECK, CALL, RAISE, and ALL IN.
- Poker actions are sent directly to Phase 336.
- Illegal actions are disabled and CALL displays the exact amount needed.

## Runtime QA
```js
window.SVR_PHASE341_QA()
window.SVR_PHASE341_REBUILD()
window.SVR_PHASE341_DEMO_DEAL()
window.SVR_PHASE341_MODEL_SELF_TEST()
```

## Protected scope
- APK remains `0.1.0-rc1`, code `1`.
- Forced updates and recurring update prompts remain disabled.
- No procedural replacement table is created.
- No claim of completed server-authoritative multiplayer.
