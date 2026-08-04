# Phase 280 Pillar Fix Boot Sync Lock

Build: `PHASE-280-PILLAR-FIX-BOOT-SYNC-LOCK`

## Summary

Phase 280 updates the game boot page to use fresh cache keys for the current pillar alignment fix.

## Why

The pillar code was updated in the runtime shim, but the boot page needed a fresh phase key so the browser requests the current files.

## Files changed

```text
game/index.html
game/docs/BUILD_VERSION.json
```

## Test

```text
https://svrpoker.com/game/?v=phase280-pillar-fix-boot-sync
```
