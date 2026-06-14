# Phase 197 — Lobby Recovery Lock

## Problem
After Phase 196 testing, the user reported:

- the lobby appeared missing
- teleport started freezing
- a visible object appeared in the hands
- a black overlay appeared in front of the view
- phase labels had previously bounced between older and newer phases

## Scope
Game-side only. Site untouched.

## Fix
- Simplified `game/index.html` boot chain.
- Removed old diagnostic/phase-bounce scripts from runtime index load:
  - `phase193_preload_scene_filter.js`
  - `phase187_official_lobby_stabilizer.js`
  - `modules/svr_module_registry_phase170.js`
  - `phase141_label_fix.js`
  - `phase152_post_boot_verify.js`
- Kept only:
  - `main.js`
  - `phase176_boot.js`
- Disabled the full-screen boot fallback overlay so it cannot sit in front of the view.
- Hid Logs/Joints buttons from the normal UI.
- Reduced the desktop HUD and bottom navigation footprint.
- Updated `game/modules/hands.js` so visible glove/controller-proxy objects no longer attach to the hands/controllers.
- Controller proxies remain invisible but still provide joint positions for teleport logic.
- Real WebXR hand mesh remains visible when hand tracking is available.
- Build version updated to `UPDATE-3.0-PHASE-197-LOBBY-RECOVERY-LOCK`.

## Locked behavior
- No full-screen black boot overlay in the face.
- No visible glove/proxy object in the hands.
- No old Phase 141/152/170/187/193 scripts fighting the build label.
- Phase 195/196 clean geometry lobby remains the active world.
- Teleport logic remains active through invisible controller proxies.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase197-lobby-recovery`.
- [ ] Confirm no black full-screen overlay stays in front of the lobby.
- [ ] Confirm build label shows Phase 197.
- [ ] Confirm the clean lobby appears.
- [ ] Confirm no strange glove/proxy object is attached to the hand/controller.
- [ ] Confirm teleport still aims and releases.
- [ ] Confirm desktop HUD is smaller and Logs/Joints are hidden.
- [ ] Confirm `window.SVR_PHASE197.active === true`.
- [ ] Confirm `window.SVR_PHASE197_HAND_OVERLAY_DISABLED === true`.

## Files changed
- `game/index.html`
- `game/modules/hands.js`
- `game/phase176_boot.js`
- `game/docs/BUILD_VERSION.json`
