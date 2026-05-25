# Phase 175 — Master Manifest Module Complete Lock

Build label: `PHASE-175-MASTER-MANIFEST-MODULE-COMPLETE-LOCK`
Date: 2026-05-24
Track: game-only

## Purpose
Finish the uploaded master manifest integration without redesigning the lobby or touching the website.

## Completed
- Preserved Phase 174 walkaround/private-room recovery package.
- Added Scorpion Room direct private-room button to the lobby navigation.
- Added enterprise bridge: `game/modules/enterprise_bridge.js`.
- Added safe/dormant modular plugin catalog under `game/js/scarlett1/`:
  - `mod_charity.js`
  - `mod_private.js`
  - `mod_sponsor.js`
  - `mod_commerce.js`
  - `mod_stream.js`
  - `mod_audio.js`
  - `mod_watch.js`
  - `mod_router.js`
  - `mod_scorpion_fx.js`
  - `mod_sportsbook.js`
  - `mod_avatar.js`
  - `mod_profile_sync.js`
  - `mod_network.js`
- Added source manifest archive: `game/docs/MASTER_MANIFEST_SOURCE_2026-05-24.txt`.
- Added runtime map: `game/docs/SCARLETT1_MODULE_REGISTRY.json`.

## Safety decisions
- Modules are safe-mode by default.
- Backend/API calls are disabled unless `window.SVR.config.backendEnabled = true` is set intentionally.
- Multiplayer connection is disabled unless `window.SVR.config.multiplayerEnabled = true` is set intentionally.
- Sportsbook/ticker logic is compliance-safe and inactive by default.
- No SQL secrets, Stripe keys, API keys, or passwords are included.
- No website files are included.
- Heavy FBX files are not included.

## Locked requirements preserved
- Direct `/game` folder deploy compatibility.
- Package under 25 MB.
- Six-seat poker table rule preserved.
- 10-second post-hand showcase rule preserved as modular event support.
- Controller fallback preserved; no hands-only-only regression.
- Private rooms remain separate pages.
- Reiki approval safety remains locked.

## Next recommended work
Do a live browser runtime sweep after deployment. Fix only actual console errors from the live build before adding features.
