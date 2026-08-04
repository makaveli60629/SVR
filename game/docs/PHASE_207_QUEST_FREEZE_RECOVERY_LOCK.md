# Phase 207 — Quest Freeze Recovery Lock

## Purpose
Phase 207 fixes the headset freeze introduced by stacking too many boot/cleanup/interaction layers. The goal is runtime stability first: no repeated heavy scene scans, no duplicate overlay boots, and no persistent cleanup loops hitting the Quest every second.

## Scope
Game-side only. Site untouched.

## Changed files
- `game/index.html`
- `game/phase176_boot.js`
- `game/phase207_freeze_guard.js`
- `game/modules/phase191_floor_authority_lock.js`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`

## Fixes
- Removed `phase203_boot.js` from the active index boot chain.
- Removed `phase206_face_overlay_fix.js` from the active index boot chain.
- Added `phase207_freeze_guard.js` with bounded cleanup only.
- Kept HTML and face-overlay suppression without constant scene traversal.
- Changed `phase176_boot.js` so it no longer runs an endless cleanup interval.
- Changed `phase191_floor_authority_lock.js` so it no longer runs floor scans forever.
- Updated the build label to `UPDATE-3.0-PHASE-207-QUEST-FREEZE-RECOVERY-LOCK`.

## Preserved
- Current lobby structure.
- Storefront shells and hub content.
- Watch module.
- Teleport rig.
- Hands/controller fallback.
- Android smart controls.
- Store portal link.
- Phase 201/202 lobby content.
- No face overlay behavior.

## Known tradeoff
The Phase 203 carousel boot is disabled from the active boot chain to prioritize Quest stability. Carousel-style interactions can be reintroduced later as a single lightweight module inside `main.js`, not as another independent boot script.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase207-freeze-recovery`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-207-QUEST-FREEZE-RECOVERY-LOCK`.
- [ ] Confirm lobby loads without freezing after 10, 30, and 60 seconds.
- [ ] Enter Quest VR and confirm no black overlay appears.
- [ ] Confirm teleport still arms, aims, and releases.
- [ ] Confirm right stick movement and snap-turn still work.
- [ ] Confirm watch still appears and does not attach a black panel to the face.
- [ ] Confirm no background city/building stack returns.
- [ ] Confirm `window.SVR_PHASE207.freezeRecovery === true`.

## Next phase recommendation
Phase 208 should be a Quest performance validation pass only:
1. Measure whether the freeze is gone.
2. Confirm teleport and movement still work.
3. Re-add only one lightweight hover/click module if needed.
4. Do not add new scenery until stability is verified.
