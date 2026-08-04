# Phase 324 Update 3.1 Version Sync Recovery Lock

Build: `PHASE-324-UPDATE-3-1-VERSION-SYNC-RECOVERY-LOCK`

## Summary

Phase 324 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds a recovery marker after Phase 323 and completes the version sync that was previously blocked for `game/version.json`.

## Behavior

- Chains after the Phase 323 export helper.
- Adds a runtime version sync panel.
- Stores `window.SVR_PHASE324_UPDATE31_VERSION_SYNC_RECOVERY_STATE`.
- Stores `window.SVR_UPDATE31_VERSION_SYNC_RECOVERY_STATE`.
- Adds `window.SVR_PHASE324_AUDIT_UPDATE31_VERSION_SYNC()`.
- Keeps `siteTouched:false` and `publicRootTouched:false`.

## Files changed

```text
game/phase324_update31_version_sync_recovery_lock.js
game/phase323_update31_gamezip_package_export_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase324-version-sync
```
