# Phase 191

Game-side only.

Added module:
- `game/modules/phase191_lobby_table_balcony_theater_portal_lock.js`

Changes:
- center rail cleanup
- real FBX table visibility lock
- material correction on existing FBX meshes only
- large SVR center logo carpet
- fourth south wall
- four-sided balcony
- no visible stairs in the active architecture layer
- always-active UPSTAIRS and LOBBY walk-through teleport volumes
- readable Vibes Theater storefront
- walk-through Vibes Theater portal
- modular theater room with animated placeholder screen
- Smokers Lounge storefront

Runtime audit:
```js
SVR_RUN_PHASE191_FULL_AUDIT()
```

Helpers:
```js
SVR_PHASE191_ENTER_THEATER()
SVR_PHASE191_EXIT_THEATER()
```

Test URL:
`/game/?v=phase191-lobby-table-balcony-theater`
