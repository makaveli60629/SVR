# Phase 299 Storefront Walkup Activation Lock

Build: `PHASE-299-STOREFRONT-WALKUP-ACTIVATION-LOCK`

## Summary

Phase 299 is game-side only. The public root page remains locked and untouched.

## Fix

The storefront floor pads now support walk-up activation.

## Activation methods preserved

```text
walk-up proximity
pointer select
keyboard shortcuts
```

## Storefront shortcuts

```text
1 = PGA
2 = Reiki
3 = Play
4 = Store
5 = Scorpion
6 = Theater
```

## Runtime globals

```text
window.SVR_PHASE299_STOREFRONT_WALKUP_ACTIVATION_LOCK
window.SVR_PHASE299_LAST_STOREFRONT_PORTAL
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
https://svrpoker.com/game/?v=phase299-storefront-walkup
```
