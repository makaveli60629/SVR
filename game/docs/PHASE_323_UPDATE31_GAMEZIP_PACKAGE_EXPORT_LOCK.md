# Phase 323 Update 3.1 Gamezip Export Lock

Build: `PHASE-323-UPDATE-3-1-GAMEZIP-PACKAGE-EXPORT-LOCK`

## Summary

Phase 323 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds a final export helper for the Update 3.1 game bundle after Phase 322 final prep.

## Behavior

- Reads `window.SVR_UPDATE31_FINAL_PACK_PREP_STATE`.
- Shows whether the build is ready for game zip prep.
- Keeps the zip-root rule visible.
- Provides package commands in a copyable panel.
- Stores state in `window.SVR_UPDATE31_GAMEZIP_PACKAGE_EXPORT_STATE`.
- Emits `svr-update31-gamezip-package-export`.

## Runtime globals

```text
window.SVR_PHASE323_UPDATE31_GAMEZIP_PACKAGE_EXPORT_LOCK
window.SVR_PHASE323_UPDATE31_GAMEZIP_PACKAGE_EXPORT_STATE
window.SVR_UPDATE31_GAMEZIP_PACKAGE_EXPORT_STATE
window.SVR_PHASE323_COPY_UPDATE31_PACKAGE_COMMANDS
window.SVR_PHASE323_AUDIT_UPDATE31_GAMEZIP_EXPORT
```

## Commands displayed

```powershell
Compress-Archive -Path .\game\* -DestinationPath .\game.zip -Force
Copy-Item .\game.zip .\update\game.zip -Force
```

## Files changed

```text
game/phase323_update31_gamezip_package_export_lock.js
game/phase322_update31_final_manifest_pack_prep_lock.js
game/docs/BUILD_VERSION.json
update/version.json
```

## Note

`game/version.json` was not updated in this pass because the connector blocked that specific write. The game-side runtime module and build docs were updated.

## Test

```text
https://svrpoker.com/game/?v=phase323-gamezip-export
```
