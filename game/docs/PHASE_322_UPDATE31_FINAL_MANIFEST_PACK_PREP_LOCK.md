# Phase 322 Update 3.1 Final Manifest Pack Prep Lock

Build: `PHASE-322-UPDATE-3-1-FINAL-MANIFEST-PACK-PREP-LOCK`

## Summary

Phase 322 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds final prep state for Update 3.1 before zip preparation.

## Gates

```text
Canvas
Rooms
Movement
Poker Deal
Android
Desktop
```

## Behavior

- Reads `window.SVR_UPDATE31_READY_STATE` from Phase 321.
- Builds final prep gates.
- Shows a final prep panel.
- Stores `window.SVR_PHASE322_UPDATE31_FINAL_MANIFEST_PACK_PREP_STATE`.
- Stores `window.SVR_UPDATE31_FINAL_PACK_PREP_STATE`.
- Emits `svr-update31-final-prep`.
- Keeps the zip root rule visible: `index.html` must stay at the game zip root.

## Runtime globals

```text
window.SVR_PHASE322_UPDATE31_FINAL_MANIFEST_PACK_PREP_LOCK
window.SVR_PHASE322_UPDATE31_FINAL_MANIFEST_PACK_PREP_STATE
window.SVR_UPDATE31_FINAL_PACK_PREP_STATE
window.SVR_PHASE322_AUDIT_UPDATE31_FINAL_PREP
```

## Files changed

```text
game/phase322_update31_final_manifest_pack_prep_lock.js
game/phase321_update31_stability_qa_lock.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase322-final-prep
```
