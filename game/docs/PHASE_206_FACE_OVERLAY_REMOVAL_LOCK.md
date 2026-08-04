# Phase 206 — Face Overlay Removal Lock

## User report
The user reported a black overlay/object stuck to the view in Quest: "Fix the black overlay in my face it something stuck to my view."

## Scope
Game-side only. Site untouched.

## Fix
- Added `game/phase206_face_overlay_fix.js`.
- Removed `phase204_boot.js` from the active game index boot chain.
- Removed `phase205_boot.js` from the active game index boot chain to prevent build-label conflict in the lobby.
- Updated `game/index.html` to load:
  - `main.js`
  - `phase176_boot.js`
  - `phase203_boot.js`
  - `phase206_face_overlay_fix.js`
- Updated `game/phase176_boot.js` to Phase 206.
- Updated build markers to Phase 206.

## Runtime protections
- Suppresses HTML overlays in XR:
  - `bootFallback`
  - `log`
  - `err`
  - `hud`
  - `sceneNav`
- Removes Phase 204 guide/feedback overlay objects from the scene.
- Removes black/face/view overlay objects if found.
- Removes matching overlay objects if attached to the camera.
- Keeps Phase 203 carousel interactions active.

## Locked behavior
- No black overlay stuck to headset view.
- No Phase 204 visual guide planes in active runtime.
- No HUD/log/error/boot overlay in XR view.
- Phase 203 carousel interactions remain active.
- Meditation page remains available through `game/reiki.html`.
- Site untouched.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase206-face-overlay-fix`.
- [ ] Enter Quest VR.
- [ ] Confirm no black rectangle/overlay is stuck to the face/view.
- [ ] Confirm HUD is hidden in headset.
- [ ] Confirm Phase 204 guide labels are no longer visible in headset.
- [ ] Confirm lobby remains visible.
- [ ] Confirm teleport remains usable.
- [ ] Confirm Wellness carousel Next/Back still works.
- [ ] Confirm `window.SVR_PHASE206.active === true`.
- [ ] Confirm `window.SVR_NO_FACE_OVERLAY === true`.

## Next phase recommendation
Phase 207 should restore lightweight hover feedback only if needed, using a small reticle at the controller ray end instead of camera-facing black guide panels.
