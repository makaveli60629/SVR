# Phase 205

Game-side only.

Added:
- `game/modules/phase205_table_surface_cards_avatar_alignment_lock.js`

Purpose:
- keep real FBX table active
- hide duplicate table felt/surface overlays
- add one lower non-blinking felt surface
- lower cards and chips onto the table surface
- realign pill avatar floating hands
- enforce one moon and one Mars
- stabilize lobby visual pieces after clean boot

Runtime audit:
```js
SVR_RUN_PHASE205_ALIGNMENT_AUDIT()
```

Test URL:
`/game/?v=phase205-table-surface-cards-avatar-alignment`
