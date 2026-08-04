# Phase 300 Storefront Route Feedback Lock

Build: `PHASE-300-STOREFRONT-ROUTE-FEEDBACK-LOCK`

## Summary

Phase 300 is game-side only. The public root page remains locked and untouched.

## Fix

Adds route feedback for storefront selection.

## Behavior

- Listens for game storefront selection events.
- Updates `window.SVR_PHASE300_LAST_ROUTE_FEEDBACK`.
- Moves desktop preview to the selected target area.
- Preserves walk-up, pointer, and keyboard storefront selection.

## Files changed

```text
game/phase300_storefront_route_feedback_lock.js
game/phase296_storefront_panels.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase300-storefront-route-feedback
```
