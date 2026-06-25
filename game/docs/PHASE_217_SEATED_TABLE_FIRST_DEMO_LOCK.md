# Phase 217

Game-side only.

Added:
- `game/modules/phase217_seated_table_first_demo_lock.js`

Primary goal:
- make the game start table-first
- force a seated close-up view aimed at the real FBX table
- keep cards and chips inside the tabletop area
- keep tags high and readable
- preserve lobby work but make table gameplay the main demo focus
- prepare the table-first module for later duplication into the Scorpion room

Runtime commands:
```js
SVR_RUN_PHASE217_TABLE_FIRST_AUDIT()
SVR_PHASE217_SEAT_TABLE_VIEW()
SVR_PHASE217_RELEASE_SEAT_VIEW()
```

Test URL:
`/game/?v=phase217-seated-table-first-demo`
