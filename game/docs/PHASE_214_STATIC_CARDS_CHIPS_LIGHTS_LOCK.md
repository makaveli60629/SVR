# Phase 214

Game-side only.

Added:
- `game/modules/phase214_static_cards_chips_lights_lock.js`

Critical correction:
- removed `phase168_playable_poker_demo_simulation_lock.js` from active boot because it was recreating/bouncing card, chip, and bot label visuals
- creates static replacement cards
- creates static replacement chip stacks
- creates static replacement bot/player labels
- adds table and lobby lights
- keeps Phase 210 movement/balcony fix active
- keeps table loader and diagnostics active

Runtime audit:
```js
SVR_RUN_PHASE214_STATIC_AUDIT()
```

Test URL:
`/game/?v=phase214-static-cards-chips-lights`
