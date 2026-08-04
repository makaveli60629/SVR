# Phase 194

Game-side only.

Added:
- `game/modules/phase194_focus_lobby_scale_alignment_lock.js`

Purpose:
- convert the small dark focus square into a full-screen focus tint layer
- remove edge-square feeling
- expand the apparent lobby footprint
- add expanded four-wall enclosure guides
- add attached second-floor balcony sections
- add connected corner pillars/posts
- remove remaining center rails/poles again

Runtime audit:
```js
SVR_RUN_PHASE194_AUDIT()
```

Test URL:
`/game/?v=phase194-focus-lobby-scale-alignment`
