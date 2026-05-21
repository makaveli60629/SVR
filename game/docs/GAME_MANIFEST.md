# SVR Poker Game Manifest

## Purpose
This folder exists to preserve working state, priorities, and handoff notes so progress is not lost between phases.

## Current package baseline
Source package used for this phase:
- `game_next_phase_store_preview_watch.zip`


## Phase 96 — Scorpion Table Front Lock
- Current active build label: `PHASE-96-SCORPION-TABLE-FRONT-LOCK`.
- Moved the visible table asset from the store-front prop path into the Scorpion game room/front-table area.
- Store front now stays as a clean kiosk/portal preview instead of showing the table model.
- Scorpion room now owns a dedicated front table mount with real table asset loading and procedural fallback.
- Runtime unapproved Reiki sponsor/founder branding remains disabled and replaced with `AWAITING APPROVAL` placeholders.
- Website/site side was not touched.

## Locked baselines
- Official forearm watch baseline is the reference watch.
- Watch screen should face upward.
- Teleport should be controlled from the watch button only.
- Hands should remain visually like real hands, including with Quest controllers.
- Correct spelling is **Reiki**.

## Current implemented areas
- Lobby shell
- Store wall fit pass
- Watch controls pass
- Live preview / low-ground autocam pass
- Table felt path
- Six-seat hover card demo pass
- League wall / podium / compass pass
- Reiki presentation area visibility pass

## Current priority order
1. Watch remains locked and stable
2. Table fully visible and seated play feel
3. Dealer + demo gameplay loop
4. Reiki presentation area polish
5. Smoothness / frame rate / cleanup
6. Final player audit pass

## Known open items
- Full playable poker interaction is not finished
- Dealer / card demo still needs polish
- Radio/music still needs a final reliable pass
- Reiki room interior teleport target is not finished
- Store wall may still need visual fit tuning in-lobby
- Player-facing game audit still pending

## Asset notes
- Store build currently expects:
  1. `store.glb`
  2. `store.fbx`
- Table path prefers the real playable felt mesh first, then a tighter fallback
- Plant assets are staged around the Reiki area in current presentation phases

## Folder intent
- `docs/GAME_MANIFEST.md` = baseline + priorities
- `docs/ERROR_CHECK.md` = last static check results
- `docs/NEXT_PHASE_PLAN.md` = immediate next implementation targets

## Latest polish recovery note
- watch baseline preserved, but moved outward on the forearm for visibility
- moon-only sky pass prioritized higher north placement
- table felt rebuilt to a simpler black logo/pass-line layout
- six-seat hover card demo upgraded
- spawn/north orientation preserved with north behind Claudia
- next priorities: seat feel, store fit visibility, Reiki blink cleanup, interactable chips/cards

## Latest polish priorities
- watch screen must face the user and sit above the wrist, not inside it
- moon should stay very high, large, and visible as a sky centerpiece
- Reiki area should minimize blinking and keep a calm glass-room presentation
- table felt should fit the interior playing surface tightly with a large centered logo and edge pass line
- six-seat hover cards should face players clearly
- skyline should leave enough room to see the sky and moon


## Phase 78 lock additions
- Watch text flipped upright again as the permanent baseline.
- Added leaderboard, tourney, and about boards as persistent lobby signage.
- Added brighter stars, more lobby sprites, and rising snow-flake style particles.
- Rebuilt the Reiki presentation area into a clearer Reiki Time Hub storefront with red carpet and plants.
- Added a large logo carpet under the poker table.
- Moon and Mars are now both visible and brighter for the skyline pass.


## Phase 94 audit relock
- Current lock was rebuilt from the later phase package, not the old helper zip.
- The accidental helper-only `game.zip` was removed from the deployment path for this package.
- This relock keeps the later lobby/runtime/modules/assets together in one repo-ready `game/` folder.
- Historical Phase 76 notes remain in `docs/` only as lineage records; they are not the active build target.


## Phase 33 donor rebase module lock (2026-04-11)
- donor baseline: uploaded `game.zip` from user on 2026-04-11
- control lock:
  - Meta hands only
  - no watch
  - no fake arms
  - fist-near-face teleport fallback
  - left-stick movement
  - right-stick 45 degree snap turn
- module split:
  - lobby-shell
  - table
  - interaction
  - hands
  - reiki
  - pga
  - sponsor
  - docs


## Phase 34 modular overlay
- Floor donor restored from earlier tile/slate lobby pass
- Reiki storefront donor restored from earlier donor pass
- PGA storefront donor restored from elegance donor pass


## Phase 35 audit / restore
- Restored the UNAPPROVED_REIKI_BRANDING_REMOVED founder image and logo assets into the Reiki hub.
- Rewrote the Reiki three-column storefront copy to read more professional and founder-led.
- Moved the PGA hub to the south-west wall.
- Raised Moon and Mars higher behind the city skyline and increased their glow.
- Added 07.mp3 as the first lobby music track.


## PHASE 36
- PGA moved to opposite wall and re-aligned
- Moon and Mars raised, brightened, and pushed behind skyline


## Phase 38 lock
- PGA hub wall/floor alignment corrected on the south-west wall
- wrist watch quick scene teleports restored
- scene quick-jumps enabled for lobby, table, seat, Reiki, PGA, legend, sponsor
- donor modular split preserved

## Phase 42 modular overlay
- UNAPPROVED_REIKI_BRANDING_REMOVED building ad refreshed to `UNAPPROVED_REIKI_BRANDING_REMOVED.COM / L.A.` in neon green presentation styling.


## Phase 99 — Private Room Portal Hardening + Module Registry

- Build label: `PHASE-99-SCORPION-ROOM-TABLE-LOCK`
- Website/site side untouched.
- Preserved Phase 96 Scorpion table front lock.
- Added private room registry module.
- Added route-safe portal markers and proximity portal handling.
- Added backup back-to-lobby portal markers for Scorpion, Reiki Room, PGA Range, VR Store, Smoker Lounge, and Space Room.
- Locked desktop movement clamp to prevent walking beyond safe lobby bounds.
- Maintained unapproved Reiki sponsor/founder branding as SVR `AWAITING APPROVAL` placeholders.


## Phase 99 full VR scene add lock
- Every private room/storefront route now has a visible VR scene pod.
- Scene pods include safe spawn mats, guard rings, sponsor/ad banner surfaces, and back-to-lobby route compatibility.
- Website/site side was not touched.

## Phase 99 — Scorpion Room Table Lock
- Build label: `PHASE-99-SCORPION-ROOM-TABLE-LOCK`
- Locked the new Scorpion table into the Scorpion Game Room/private room.
- Storefront remains a portal/kiosk preview only.
- Procedural fallback table remains visible if the GLB table asset is missing or dark.
- Site untouched.

---

# Phase 100 — Lobby Portal Cleanup Lock

Recorded locked user feedback:
- Too many portal pads were visible after Phase 99.
- Lobby must have one portal per storefront only.
- Private scenes should not appear as clutter inside the main lobby.
- Moon and Mars must remain visible in the lobby.
- Scorpion front table is display-only; real Scorpion gameplay routes to private gameplay room.
- Espresso with Cream ad belongs on a tall building wall aligned behind the Reiki hub.
- Watch must include a working HOLO button.
- Fist/chinch teleport must work again with hand tracking, even if controller fallback exists.

Implementation:
- Build label: PHASE-100-LOBBY-PORTAL-CLEANUP-LOCK
- Added `PHASE_100_LOBBY_PORTAL_CLEANUP_LOCK` registry constants.
- Cleaned portal routing to storefront-only portal markers.
- Added Scorpion private gameplay room target.
- Added Reiki-aligned Espresso wall ad building.
- Repaired hand fist/chinch teleport activation.
- Added watch HOLO button and DOM holo menu toggle.


## Phase 101 — VR Runtime Correction Lock

- Build label: `PHASE-101-VR-RUNTIME-CORRECTION-LOCK`
- Corrected the pasted handoff errors by keeping the active Three.js/WebXR runtime instead of replacing it with an A-Frame scaffold.
- Added native Three.js wrist hologram panel tied to the watch Holo state.
- Reduced portal clutter by hiding duplicate Reiki/Scorpion internal rings and removing the visible Space floor portal from the lobby.
- Preserved one storefront portal per hub and kept private scenes outside the lobby.
- Improved controller locomotion axis recovery for Quest/WebXR variations.
- Relaxed hand pinch/fist thresholds to restore fist/chinch teleport reliability.
- Repositioned Moon/Mars for stronger lobby visibility.
- Enlarged/aligned Espresso with Cream ad behind the Reiki hub area.
- Site untouched.


## Phase 102 — VR Visual Alignment Lock

- Build label: `PHASE-102-VR-VISUAL-ALIGNMENT-LOCK`
- Fixed Quest-visible Moon and Mars by moving them higher/closer and disabling depth-test on the planet meshes.
- Rebuilt Espresso with Cream as a larger building-wall ad directly behind the Reiki hub area.
- Fixed Scorpion room table overlap so only one display table is visible when the real asset loads.
- Re-aligned the Juan Espejo PGA Hub display so the info panel and portrait remain fully visible.
- Added a raised watch HOLO button and visible wrist hologram panel.
- Restored close-fist teleport glow and release-to-teleport behavior.
- Website/site side untouched.


## Phase 103 — Boot Rescue Lock

- Fixed Booting freeze caused by duplicate watch hologram declarations.
- Kept current Three.js/WebXR runtime; do not replace with A-Frame index.
- Preserved Phase 102 visual targets: Moon/Mars visibility, Espresso sign, Scorpion table, PGA alignment, watch HOLO button, fist teleport target glow.
- Site untouched.


## Phase 104 — Boot Constant + A-Frame Guard Lock
- Fixed the phase build constant mismatch that could stop boot.
- Active build label: `PHASE-104-BOOT-CONSTANT-AFRAME-GUARD`.
- Pasted A-Frame watch-ui code is not loaded into the active Three.js/WebXR runtime.
- Future watch changes must edit `game/modules/watch.js` only.
- Site untouched.


## Phase 105 — Boot Safe Runtime Lock

- Build label: `PHASE-105-BOOT-SAFE-RUNTIME-LOCK`.
- Added a non-blocking boot wrapper in `game/main.js`.
- Moved the real Three.js/WebXR runtime to `game/main-runtime.js`.
- Added an emergency rendered loading panel so the canvas never stays black while assets load.
- Added timeout-protected world loading with a minimal fallback world if the full skyline build fails.
- Kept A-Frame snippets quarantined; the live game remains Three.js/WebXR.
- Preserved Phase 102/103 visual/watch/fist teleport fixes where present.
- Site untouched.


## Phase 106 — HoloCtx Boot Fix Lock
- Corrected boot rescue error: `Identifier 'holoCtx' has already been declared`.
- Locked current Three.js/WebXR runtime; do not replace with A-Frame snippets.
- Watch hologram now uses unique scoped Phase 106 canvas/context names.
- Keep Scorpion/PGA/Reiki/private scene work from prior phases.
- Site untouched.


## Phase 107 — Visual Table Flow Lock
- Build label: `PHASE-107-VISUAL-TABLE-FLOW-LOCK`.
- Raised Moon and Mars higher in the skyline and increased halo/glow opacity for Quest visibility.
- Rebuilt the Espresso with Cream wall holder behind the Reiki hub so the ad face points back toward the Reiki/lobby sightline.
- Removed the visual guard rail in front of the Scorpion game room so users can walk in and inspect the display table.
- Rebuilt Scorpion table felt with one centered SVR/Scorpion logo, one pass/bet line, a Player Stack zone, and an Action Zone for call/raise/fold gestures.
- Preserved the current Three.js/WebXR runtime; no A-Frame replacement.
- Website/site untouched.

## Phase 108 — Watch Teleport Locomotion Lock

- Watch hologram starts OFF by default.
- Physical HOLO button toggles compact hologram ON/OFF.
- TP ON/OFF and MOVE ON/OFF are separate watch controls.
- MOVE OFF disables stick locomotion without disabling teleport.
- Fist teleport now provides cyan hand glow, teleport arc, target glow, and release-to-jump behavior.
- Current Three.js/WebXR runtime preserved; no A-Frame replacement.
- Site untouched.


## Phase 109 — Registry Export Boot Lock
- Fixed private room registry missing export boot error.
- Added backward-compatible phase exports so mixed cached modules do not crash the runtime.
- Build label: `PHASE-109-REGISTRY-EXPORT-BOOT-LOCK`.
- Site untouched.


## Phase 110 — Boot Verified Watch Stability Lock

- Build label: `PHASE-110-BOOT-VERIFIED-WATCH-STABILITY-LOCK`.
- Confirmed the active runtime should boot through the Phase 109 registry export fix.
- Added Phase 110 registry compatibility export.
- Watch hologram remains OFF by default.
- HOLO / TP / MOVE controls remain separate for usability and Quest safety.
- No site-side changes.


## Phase 111 — Sky + Espresso Face Center Lock

- Build label: `PHASE-111-SKY-ESPRESSO-FACE-CENTER-LOCK`.
- Raised and enlarged Moon/Mars for Quest visibility above skyline/buildings.
- Rebuilt Espresso wall holder to face center/Reiki/lobby view.
- Added restored real Espresso ad texture at `assets/ui/espresso-with-cream-real.png` with procedural fallback preserved.
- Site untouched.
