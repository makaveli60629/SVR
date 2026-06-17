# Phase 295 Storefront Doorway Trim Lock

Build: `PHASE-295-STOREFRONT-DOORWAY-TRIM-LOCK`

## Summary

Phase 295 is game-side only. The public root launch page remains locked and untouched.

## Fix

- Places slim rear trim columns at storefront doorway edges.
- Keeps storefront sign centers clear.
- Adds ten edge trim pieces across the five rear storefront bays.
- Chains the trim lock through the already-loaded lobby QA module.

## Files changed

```text
game/phase295_storefront_doorway_trim_lock.js
game/phase101t_lobby_interaction_portal_qa_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase295-storefront-doorway-trim
```
