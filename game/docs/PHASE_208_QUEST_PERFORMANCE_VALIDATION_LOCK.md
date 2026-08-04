# Phase 208 — Quest Performance Validation Lock

## Purpose
Phase 208 validates the Phase 207 freeze recovery without adding new scenery or more boot complexity. This phase is deliberately narrow: confirm Quest stability, record frame stats, and keep the lobby/storefront baseline unchanged.

## Scope
Game-side only. Site untouched.

## Changed files
- `game/index.html`
- `game/main.js`
- `game/phase176_boot.js`
- `game/phase208_quest_perf_validation.js`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`

## Added
- `phase208_quest_perf_validation.js`
- Lightweight runtime stats under:
  - `window.SVR_PHASE208`
  - `window.SVR_PHASE208_STATS`
- Average FPS tracking.
- Minimum FPS tracking.
- Long-frame count tracking.
- Worst frame delta tracking.
- 90-second validation window.
- Quest render-scale clamp.
- No scene traversal loop.
- No new visual objects.

## Preserved
- Phase 207 freeze recovery guard.
- Simplified boot chain.
- Current lobby structure.
- Phase 201 hub content.
- Phase 202 storefront shells.
- Watch module.
- Teleport rig.
- Hands/controller fallback.
- Android smart controls.
- Store portal link.
- No face overlay behavior.

## Active boot chain
```text
main.js
phase176_boot.js
phase207_freeze_guard.js
phase208_quest_perf_validation.js
```

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase208-quest-performance`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-208-QUEST-PERFORMANCE-VALIDATION-LOCK`.
- [ ] Wait 60 seconds in desktop preview; confirm no freeze.
- [ ] Enter Quest VR and wait 60 seconds in lobby; confirm no freeze.
- [ ] Confirm no black overlay appears.
- [ ] Confirm watch remains visible and not attached to face.
- [ ] Confirm teleport still works.
- [ ] Confirm right-stick forward/back and snap-turn still work.
- [ ] In browser console, confirm `window.SVR_PHASE208_STATS` updates.
- [ ] If long frames increase sharply, stop adding features and run another performance pass.

## Next phase recommendation
Phase 209 should only happen after Quest confirms stable:
1. Restore one lightweight hover/selection highlight if needed.
2. Keep it inside `main.js` or one passive module only.
3. Do not re-add independent heavy boot scripts.
4. Do not add new scenery until performance is verified.
