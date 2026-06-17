# Phase 301 XR Storefront Route Execution Lock

Build: `PHASE-301-XR-STOREFRONT-ROUTE-EXECUTION-LOCK`

## Summary

Phase 301 is game-side only. The public root page remains locked and untouched.

## Fix

Adds XR-aware route execution for storefront selections.

## Behavior

- Listens for storefront selection events.
- Moves desktop preview to the selected target.
- Uses a teleport rig API when present.
- Uses an XR reference fallback when a teleport API is not exposed.
- Stores route state in `window.SVR_PHASE301_LAST_ROUTE_EXECUTION`.

## Runtime globals

```text
window.SVR_PHASE301_XR_STOREFRONT_ROUTE_EXECUTION_LOCK
window.SVR_PHASE301_EXECUTE_ROUTE
window.SVR_PHASE301_LAST_ROUTE_EXECUTION
```

## Files changed

```text
game/phase301_xr_storefront_route_execution_lock.js
game/phase300_storefront_route_feedback_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Public page rule

Do not touch root `index.html` or public launch assets unless explicitly requested.

## Test

```text
https://svrpoker.com/game/?v=phase301-xr-storefront-route
```
