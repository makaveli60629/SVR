# Phase 192 — Lobby Visual Cleanup Lock

## Source
Screenshot review: current lobby view showed oversized wall slabs, canopy/balcony clutter, bright floor washout, desktop HUD clutter, and `VR NOT SUPPORTED` overlay text in the preview.

## Scope
Game-side only. Site untouched.

## Fix
- Added `game/modules/phase192_lobby_visual_cleanup.js`.
- Hides oversized Phase185 wall slabs and vertical banners that block the view.
- Hides balcony/canopy rings, old center stage pieces, Phase188 second-floor systems, and Phase189 duplicate upper/sky floor leftovers.
- Tunes the official visual floor darker to reduce washout.
- Reduces lobby light intensity that was blowing out the floor and panels.
- Adds five cleaner modular wall/kiosk panels:
  - Play Game
  - Wellness
  - PGA
  - SVR Store
  - Scorpion
- Compacts desktop preview HUD by hiding Logs/Joints from the top bar and scaling down the bottom nav.
- Relabels unsupported desktop WebXR button to `DESKTOP PREVIEW` and dims it.
- Preserves Phase 190 Quest controller forward teleport.
- Preserves Phase 191 floor authority.

## Locked behavior
- Lobby should read as a cleaner walkable 3D room.
- No giant dark blue slab should block the entrance view.
- No floating canopy/second-floor slab should dominate the camera.
- Desktop preview buttons are compact.
- Quest/game systems remain preserved.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase192-cleanup`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-192-LOBBY-VISUAL-CLEANUP-LOCK`.
- [ ] Confirm the giant blue wall slabs are gone or no longer blocking the view.
- [ ] Confirm the top canopy/upper floor clutter is gone.
- [ ] Confirm the floor is less washed out.
- [ ] Confirm five clean panels are visible around the lobby.
- [ ] Confirm teleport and movement still work.
- [ ] Confirm Phase 190 controller forward ray still works in Quest.
- [ ] Confirm `window.SVR_PHASE192_LOBBY_CLEANUP.locked === true`.

## Files changed
- `game/modules/phase192_lobby_visual_cleanup.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
