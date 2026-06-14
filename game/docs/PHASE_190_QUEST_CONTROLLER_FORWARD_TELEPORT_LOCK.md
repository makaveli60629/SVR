# Phase 190 — Quest Controller Forward Teleport Lock

## Source issue
GitHub issue #96: `[launch-blocker][vr] Fix Quest right-controller teleport forward`

## Scope
Game-side only. Site untouched.

## Fix
- Updated `game/modules/teleport.js` so controller teleport ray uses WebXR controller local `-Z` as the target-ray forward direction.
- Added a safe `+Z` fallback only when the controller/browser orientation reports a reversed ray.
- Added debug state on `window.SVR_PHASE184_CONTROLLER_RAY` showing selected ray source, forward scores, and fallback flips.
- Preserved right-stick up/down movement.
- Preserved right-stick left/right 45-degree snap turn.
- Preserved hold-to-aim / release-to-teleport behavior for A / grip / trigger.
- Preserved hand tracking teleport path.
- Preserved Phase 189 sky/floor hardlock.

## Locked behavior
- Right Quest controller forward should aim the teleport ray forward.
- The ray should not appear behind the player unless the controller is actually aimed behind.
- Teleport remains hold → aim → release.
- No accidental instant teleport.
- Movement still uses right stick forward/back and snap turn.

## Test checklist
- [ ] Enter Quest/Oculus VR session.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-190-QUEST-CONTROLLER-FORWARD-TELEPORT-LOCK`.
- [ ] Hold A / grip / trigger on the right controller.
- [ ] Confirm purple teleport arc appears forward from the controller.
- [ ] Release to teleport.
- [ ] Turn headset 45 degrees and press right stick forward.
- [ ] Confirm movement goes forward as expected.
- [ ] Confirm no instant accidental teleport.

## Files changed
- `game/modules/teleport.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
