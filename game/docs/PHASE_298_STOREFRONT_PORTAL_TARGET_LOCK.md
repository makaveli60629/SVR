# Phase 298 Storefront Portal Target Lock

Build: `PHASE-298-STOREFRONT-PORTAL-TARGET-LOCK`

## Summary

Phase 298 is game-side only. The public root page remains locked and untouched.

## Fix

The readable storefront signs and pads now carry route data and selection events.

## Storefront route keys

```text
1 = PGA
2 = Reiki
3 = Play
4 = Store
5 = Scorpion
6 = Theater
```

## Runtime global

```text
window.SVR_PHASE298_STOREFRONT_PORTAL_TARGET_LOCK
window.SVR_PHASE298_LAST_STOREFRONT_PORTAL
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
https://svrpoker.com/game/?v=phase298-storefront-portal-targets
```
