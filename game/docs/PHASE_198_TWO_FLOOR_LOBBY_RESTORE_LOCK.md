# Phase 198 — Two-Floor Lobby Restore Lock

## User correction
The clean reset removed too much of the lobby. The user wants the upstairs / two-floor lobby back, but without the old blinking background buildings, black face overlay, hand overlay object, or phase-label bounce.

## Scope
Game-side only. Site untouched.

## Fix
- Restored an upstairs/two-floor lobby look inside `game/modules/phase195_clean_lobby_world.js`.
- Kept the clean Phase 195/197 runtime path, meaning the legacy `world_skyline.js`, old octagon stack, and background building modules remain bypassed.
- Added clean second-floor geometry:
  - upstairs balcony surface
  - inner/outer railings
  - transparent guard glass
  - support/rail posts
  - stairs
  - upstairs Legends, Sponsor, and Events wall panels
- Preserved lower lobby module bays:
  - Play Game
  - Wellness
  - PGA Training
  - SVR Store
  - Scorpion
- Preserved the intended lobby poker table.
- Preserved one Moon and one Mars only.
- Updated floor authority so the restored upstairs geometry is allowed and is not hidden as a duplicate floor.
- Updated index and boot label to Phase 198.

## Locked behavior
- Two-floor/upstairs lobby is back.
- No old skyline/building background.
- No octagon stack.
- No duplicate planets.
- No full-screen boot overlay.
- No visible glove/proxy object in hand.
- No Phase 187/193 label bounce.

## Test checklist
- [ ] Load `https://svrpoker.com/game/?v=phase198-two-floor-lobby`.
- [ ] Confirm build label: `UPDATE-3.0-PHASE-198-TWO-FLOOR-LOBBY-RESTORE-LOCK`.
- [ ] Confirm upstairs/balcony ring is visible.
- [ ] Confirm stairs are visible.
- [ ] Confirm downstairs lobby and poker table are visible.
- [ ] Confirm no old background buildings blink in/out.
- [ ] Confirm one Moon and one Mars only.
- [ ] Confirm no black overlay appears in front of the view.
- [ ] Confirm no glove/proxy object is attached to hands/controllers.
- [ ] Confirm teleport still works.
- [ ] Confirm `window.SVR_PHASE198_TWO_FLOOR_LOBBY.locked === true`.

## Files changed
- `game/modules/phase195_clean_lobby_world.js`
- `game/modules/phase191_floor_authority_lock.js`
- `game/phase176_boot.js`
- `game/index.html`
- `game/docs/BUILD_VERSION.json`
