# Phase 211

Game-side only.

Added:
- `game/modules/phase211_no_blink_visual_stabilizer_lock.js`

Critical correction:
- removed active Phase 205, Phase 206, and Phase 209 from boot because they were running intervals that fought each other
- kept Phase 210 movement and balcony fix
- freezes bot labels, cards, chips, and balcony glass positions
- hides older duplicate table surfaces
- keeps sky and planets removed

Runtime audit:
```js
SVR_RUN_PHASE211_NO_BLINK_AUDIT()
```

Test URL:
`/game/?v=phase211-no-blink-visual-stabilizer`
