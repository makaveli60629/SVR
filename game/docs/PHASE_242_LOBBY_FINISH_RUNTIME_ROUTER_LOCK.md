# Phase 242 - Lobby Finish Runtime Router Lock

## Purpose

The live game was still showing the older Phase 237 runtime label even after the newer lobby files were present. Phase 242 makes the old watchdog act as the current lobby router so the active build label and lobby finish layer stay in sync.

## Changes

- `game/phase237_runtime_watchdog_lock.js` now stamps Phase 242.
- It imports the Phase 240 Grand Palace lobby layer.
- It imports the Phase 241 single-layer cleanup guard.
- `game/index.html` now uses Phase 242 cache keys.
- `game/docs/BUILD_VERSION.json` now reports Phase 242.

## Preserved

- Site untouched.
- Game-only update.
- Watch, movement, store portal, and table routing preserved.
- Phase 240 Grand Palace direction preserved.
- Phase 241 duplicate cleanup preserved.

## Test

Open:

`https://svrpoker.com/game/?v=phase242-lobby-finish-router`

Then hard refresh after deploy.
