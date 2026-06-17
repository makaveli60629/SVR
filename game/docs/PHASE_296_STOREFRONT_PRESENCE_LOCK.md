# Phase 296 Storefront Presence Lock

Build: `PHASE-296-STOREFRONT-PRESENCE-LOCK`

## Summary

Phase 296 is game-side only. The public root page remains locked and untouched.

## Storefronts tracked

```text
REIKI HUB
PGA GOLF
PLAY GAME
SVR STORE
SCORPION
THEATER
```

## Runtime globals

```text
window.SVR_PHASE296_STOREFRONT_PRESENCE_LOCK
window.SVR_PHASE296_STOREFRONT_PANEL_VISUALS
```

## Files changed

```text
game/phase296_storefront_presence_lock.js
game/phase296_storefront_panels.js
game/phase101t_lobby_interaction_portal_qa_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase296-storefront-presence
```
