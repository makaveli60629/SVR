# Phase 297 Storefront Readable Sign Lock

Build: `PHASE-297-STOREFRONT-READABLE-SIGN-LOCK`

## Summary

Phase 297 is game-side only. The public root page remains locked and untouched.

## Fix

Upgrades the storefront panel placeholders into readable in-game signs for:

```text
REIKI HUB
PGA GOLF
PLAY GAME
SVR STORE
SCORPION
THEATER
```

## Files changed

```text
game/phase296_storefront_panels.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase297-storefront-readable-signs
```
