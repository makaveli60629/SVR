# Phase 218

Game-side only.

Added:
- `game/modules/phase218_table_play_mode_watch_restore_lock.js`
- `game/modules/phase218_table_focus_watch_lock.js`

Purpose:
- stabilize table-first play mode
- keep player at the seated table view
- quiet travel/laser visuals while testing table interaction
- restore a visible watch-style button and a large front table-play panel
- keep table/cards/chips/tags and lobby modules active

Runtime audit:
```js
SVR_RUN_PHASE218_FOCUS_WATCH_AUDIT()
SVR_RUN_PHASE218_TABLE_PLAY_AUDIT()
```

Test URL:
`/game/?v=phase218-table-play-watch`

Note:
- The active boot remains labeled Phase 217 in the body while Phase 218 focus-watch module is appended, because a full HTML relabel was blocked by the connector. The Phase 218 module is still loaded by the active boot.
