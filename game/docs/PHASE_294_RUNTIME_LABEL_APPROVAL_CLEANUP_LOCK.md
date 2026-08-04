# Phase 294 — Runtime Label + Approval Cleanup Lock

## Scope

Game-side patch only. Website and site files are protected and were not touched.

## Changed files

- `game/main.js`
- `game/modules/private_scene_common.js`
- `game/range.html`
- `game/docs/PHASE_294_RUNTIME_LABEL_APPROVAL_CLEANUP_LOCK.md`

## Locked changes

- Aligned `game/main.js` runtime label to `PHASE-294-RUNTIME-LABEL-APPROVAL-CLEANUP-LOCK`.
- Preserved the Phase 293 lobby visual truth baseline.
- Removed old unapproved Reiki sponsor wording from `game/modules/private_scene_common.js`.
- Kept Reiki private scene approval-safe with SVR placeholder wording and `AWAITING APPROVAL` language.
- Added `game/range.html` as a simple alias route to the private PGA Drive scene.

## Protected areas

- Root website files were not edited.
- `/site` was not edited.
- Lobby layout was not redesigned.
- No stale `game.zip` was uploaded.

## Test routes

- `/game/?v=phase294-runtime-cleanup`
- `/game/reiki.html?v=phase294-approval-cleanup`
- `/game/range.html?v=phase294-range-alias`
- `/game/pga-drive.html?v=phase294-pga-drive`
