# Phase 212

Game-side only.

Added:
- `game/modules/phase212_stable_poker_labels_chips_lock.js`

Purpose:
- hide dynamic bot labels and chip stacks that were recreated by the poker demo module
- create stable replacement labels and chip stacks
- stop bot tag blinking
- stop chip bouncing/blinking
- preserve table, cards, movement, balcony, and poker logic

Runtime audit:
```js
SVR_RUN_PHASE212_STABLE_AUDIT()
```

Test URL:
`/game/?v=phase212-stable-poker-labels-chips`
