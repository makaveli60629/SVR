# Phase 216

Game-side only.

Added:
- `game/modules/phase216_planned_lobby_look_finish_lock.js`

Purpose:
- finish the lobby look according to the current plan
- clean dark room shell
- aligned walls
- second floor touches every wall and corner
- second floor sits above visible pillars
- continuous glass balcony fence and gold rail caps
- cyan/purple/gold trim and stable lighting
- no sky and no planets
- keep table, cards, chips, tags, movement, and portals active

Runtime audit:
```js
SVR_RUN_PHASE216_LOBBY_AUDIT()
```

Test URL:
`/game/?v=phase216-planned-lobby-look-finish`
