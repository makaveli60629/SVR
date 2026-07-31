# Phase 341 — Canonical Table Geometry and Card Motion Lock

## Build
`PHASE-341-CANONICAL-TABLE-GEOMETRY-CARD-MOTION-LOCK`

Phase 341 keeps the uploaded FBX table as the sole table body and creates one mathematical table-local layout for the south/front player seat, five bots, centered logo, pass line, burn pile, muck, hole cards, and community cards.

It replaces duplicate static card planes with one reusable card pool and animates left-to-right hole-card dealing, burns, flop, turn, river, folds, and showdown flips from the Phase 336 authoritative state.

Android preserves one MOVE stick and one LOOK stick. Its action rail sends legal poker commands directly to Phase 336 and shows the exact call amount.

## Runtime QA
```js
window.SVR_PHASE341_QA()
window.SVR_PHASE341_REBUILD()
window.SVR_PHASE341_DEMO_DEAL()
window.SVR_PHASE341_MODEL_SELF_TEST()
```
