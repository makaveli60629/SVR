# Phase 219

Game-side only.

Added:
- `game/modules/phase219_table_position_options_control_lock.js`

Purpose:
- add a small Oculus position display in front of the player
- add table distance / height options while seated
- map left-hand menu / hamburger / pinch-style option signal to open the table options panel
- keep travel/teleport off at the table
- deal two cards to six players
- place side chips near the player and each bot
- lower the player's hand cards and all dealt cards toward the real tabletop surface
- float the community cards / burn-turn area above the table center
- raise all tags higher so they do not block the table view

Runtime commands:
```js
SVR_RUN_PHASE219_TABLE_OPTIONS_AUDIT()
SVR_PHASE219_OPTIONS_OPEN()
SVR_PHASE219_OPTIONS_CLOSE()
SVR_PHASE219_NUDGE_FORWARD()
SVR_PHASE219_NUDGE_BACK()
SVR_PHASE219_NUDGE_UP()
SVR_PHASE219_NUDGE_DOWN()
```

Test URL:
`/game/?v=phase219-table-position-options-control`
