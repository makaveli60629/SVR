# Phase 98S-Z — Full Manifest and Next Phase Plan

Date: 2026-06-02
Track: SVR Poker game-side restore and stabilization

## Current objective

Restore the lobby back toward the working presentation state from the prior day while preserving the stable routing and avoiding another destructive broad rebuild.

The current priority is not a new visual design pass. The priority is:

1. Lobby hubs visible again.
2. Correct private-room routes open.
3. Android controls visible and functional.
4. Music/audio off by default.
5. Reiki hologram preserved.
6. Moon/Mars preserved.
7. Scorpion playable room preserved.
8. No broken or missing module paths.

---

## Current active phase stack

### Phase 98S-W — Room Portal Enablement Lock

Purpose:

- Turn on private room pages and route buttons.
- Keep the main lobby as the main lobby.
- Keep full rooms separate from the lobby.

Files involved:

- `game/modules/room_portal_routes_lock.js`
- `game/pga-chip-putt.html`
- `game/reiki-room.html`
- `game/docs/PHASE_98S_W_ROOM_PORTAL_ENABLEMENT_LOCK.md`

Routes enabled:

- `game/scorpion.html`
- `game/pga-drive.html`
- `game/pga-chip-putt.html`
- `game/reiki-room.html`
- `game/smoker-lounge.html`
- `game/store-room.html`

### Phase 98S-X — Lobby Hub Restore + Music Off

Purpose:

- Restore visible lobby hub/storefront signs.
- Restore hub portal rings/glows.
- Keep music/audio off by default.
- Avoid the bad cluttered overlay that damaged the presentation layout.

Files involved:

- `game/modules/lobby_hub_restore_safe.js`
- `game/index.html`

Current restored hub layer:

- Reiki Hub
- PGA Training
- SVR Store
- Private Lounge
- Scorpion Room

Audio rule:

- `window.SVR_MUSIC_OFF_DEFAULT = true`
- audio/video elements muted on load
- no autoplay audio from spawn

### Phase 98S-Y — Android Controls Emergency Restore

Purpose:

- Restore missing Android controls module.
- Add two visible mobile sticks.
- Add mobile action buttons.
- Provide direct mobile buttons for room routing.

Files involved:

- `game/modules/android_controls_lock.js`

Mobile UI currently includes:

- left stick
- right stick
- SIT
- TELEPORT
- REIKI
- PGA
- STORE
- SCORPION

Important status:

The Android controls module is restored and displays controls, but the next phase must confirm/bind those controls into actual camera/player movement if `main.js` does not already listen for `svr-mobile-control` events.

---

## Current known issue

User report after Phase 98S-Y:

> Android nothing seems to work.

Likely cause:

- The missing Android controls module was restored.
- The visual controls and action buttons exist.
- However, `main.js` may not yet consume the dispatched `svr-mobile-control` events for movement, turning, sit, and teleport.
- Room route buttons should route directly from the mobile overlay, but this needs live validation.

---

## Locked preservation rules

Do not remove or break:

- `game/modules/android_controls_lock.js`
- `game/modules/lobby_hub_restore_safe.js`
- `game/modules/room_portal_routes_lock.js`
- `game/modules/reiki_finish_patch.js`
- `game/modules/moon_mars_finish_patch.js`
- `game/scorpion.html`
- `game/pga-drive.html`
- `game/pga-chip-putt.html`
- `game/reiki-room.html`
- `game/smoker-lounge.html`
- `game/store-room.html`

Do not reintroduce:

- destructive broad lobby rebuilds
- old cluttered overlay behavior
- autoplay lobby music
- unapproved Reiki partner branding
- rooms physically embedded inside the main lobby

---

## Current expected live test link

Main game:

`/game/?v=phase98sy-android-controls&present=1`

Lobby restore test:

`/game/?v=phase98sx-lobby-hub-restore&present=1`

Private room links:

`/game/scorpion.html?v=phase98sw-room-portals`
`/game/pga-drive.html?v=phase98sw-room-portals`
`/game/pga-chip-putt.html?v=phase98sw-room-portals`
`/game/reiki-room.html?v=phase98sw-room-portals`
`/game/smoker-lounge.html?v=phase98sw-room-portals`
`/game/store-room.html?v=phase98sw-room-portals`

---

## Next phase

# Phase 99A — Android Movement and Portal Bind Fix

Primary objective:

Make Android not just show controls, but actually work.

Required work:

1. Audit `game/main.js` for mobile-control event listeners.
2. If missing, add listeners for `svr-mobile-control`.
3. Bind left stick to forward/back/strafe movement.
4. Bind right stick to look/snap-turn behavior.
5. Bind SIT to sit/open-seat behavior or a safe fallback.
6. Bind TELEPORT to teleport toggle/fallback or a safe player reposition fallback.
7. Ensure direct mobile room buttons still open:
   - Reiki Room
   - PGA Drive
   - Store Room
   - Scorpion Room
8. Keep music/audio muted by default.
9. Keep restored lobby hubs visible.
10. Preserve all private-room pages.

Acceptance test:

- On Android, controls appear.
- Left stick visibly moves the camera/player.
- Right stick visibly turns/looks or snap-turns.
- REIKI opens `reiki-room.html`.
- PGA opens `pga-drive.html`.
- STORE opens `store-room.html`.
- SCORPION opens `scorpion.html`.
- Music is silent at spawn.
- Lobby hubs are visible.

---

## Next phase after 99A

# Phase 99B — Lobby Visual Recovery QA

Only after Android controls are functional:

- Review screenshots of the lobby.
- Adjust hub positions if misplaced.
- Rebuild storefront appearance only if needed.
- Keep all rooms as separate private pages.
- Keep audio off by default.

---

## PowerShell deploy checklist

Run from local repo:

```powershell
cd "C:\Users\$env:USERNAME\SVR"

git pull origin main

git status

git add game/index.html `
        game/modules/android_controls_lock.js `
        game/modules/lobby_hub_restore_safe.js `
        game/modules/room_portal_routes_lock.js `
        game/pga-chip-putt.html `
        game/reiki-room.html `
        game/docs/PHASE_98S_W_ROOM_PORTAL_ENABLEMENT_LOCK.md `
        game/docs/PHASE_98S_Z_FULL_MANIFEST_AND_NEXT_PHASE.md

git commit -m "Phase 98S-Z full manifest and next phase plan" 2>$null

git push origin main
```

Then run GitHub Actions Auto Deploy.

---

## Notes

This manifest intentionally separates visual recovery from Android functionality. Android controls must be made functional before more lobby visual rebuilding, because the user needs away-from-PC testing on phone.
