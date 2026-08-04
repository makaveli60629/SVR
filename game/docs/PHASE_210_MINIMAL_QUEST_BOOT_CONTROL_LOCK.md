# Phase 210 — Minimal Quest Boot Control Lock

## Purpose
Phase 210 reduces runtime boot complexity after the Quest freeze and black-square reports.

## Scope
Game-side only. Site untouched.

## Changes
- Added `game/phase210_minimal_boot_lock.js`.
- Updated `game/index.html` to use a smaller active boot chain.
- Preserved the Phase 209 locomotion / teleport / stair / sky fix.

## Active boot chain
```text
main.js
phase176_boot.js
phase209_quest_stability_scene_fix.js
phase210_minimal_boot_lock.js
```

## Removed from active index chain
- `phase207_freeze_guard.js`
- `phase208_quest_perf_validation.js`

The Phase 207/208 code remains in the repo for audit/history, but it is not loaded by the active game index in this phase.

## Why
The prior recovery stack had too many helper boots loaded at once. Phase 210 keeps the actual control fix active while reducing the number of startup modules that run in Quest.

## Preserved
- Phase 209 head-relative movement.
- Phase 209 hold-release teleport.
- Phase 209 black-square cleanup.
- Phase 209 Moon/Mars scale/texture/height/orbit.
- Phase 209 stair/upstairs floor height support.
- Current lobby/storefront visuals.
- Site untouched.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase210-minimal-quest-boot`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-210-MINIMAL-QUEST-BOOT-CONTROL-LOCK`.
- [ ] Enter Quest VR and wait 60 seconds.
- [ ] Confirm no freeze.
- [ ] Confirm no black square stays on the face.
- [ ] Confirm forward follows headset direction after a 45-degree turn.
- [ ] Confirm hold-release A / grip / trigger teleport works.
- [ ] Confirm Moon and Mars are high, bigger, textured, and moving.
- [ ] Confirm stairs can be walked up.
