# SVR Poker Game Manifest

## Purpose
This folder exists to preserve working state, priorities, and handoff notes so progress is not lost between phases.

## Current package baseline
Source package used for this phase:
- `game_next_phase_store_preview_watch.zip`

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


## Phase 199 lock additions
- Watch text flipped upright again as the permanent baseline.
- Added leaderboard, tourney, and about boards as persistent lobby signage.
- Added brighter stars, more lobby sprites, and rising snow-flake style particles.
- Rebuilt the Reiki presentation area into a clearer Reiki Time Hub storefront with red carpet and plants.
- Added a large logo carpet under the poker table.
- Moon and Mars are now both visible and brighter for the skyline pass.


## Phase 199 audit relock
- Current lock was rebuilt from the later phase package, not the old helper zip.
- The accidental helper-only `game.zip` was removed from the deployment path for this package.
- This relock keeps the later lobby/runtime/modules/assets together in one repo-ready `game/` folder.
- Historical Phase 199 notes remain in `docs/` only as lineage records; they are not the active build target.


## Phase 199 donor rebase module lock (2026-04-11)
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


## Phase 199 modular overlay
- Floor donor restored from earlier tile/slate lobby pass
- Reiki storefront donor restored from earlier donor pass
- PGA storefront donor restored from elegance donor pass


## Phase 199 audit / restore
- Restored the SVR Wellness partner image and logo assets into the Reiki hub.
- Rewrote the Reiki three-column storefront copy to read more professional and partner-led.
- Moved the PGA hub to the south-west wall.
- Raised Moon and Mars higher behind the city skyline and increased their glow.
- Added 07.mp3 as the first lobby music track.


## PHASE 36
- PGA moved to opposite wall and re-aligned
- Moon and Mars raised, brightened, and pushed behind skyline


## Phase 199 lock
- PGA hub wall/floor alignment corrected on the south-west wall
- wrist watch quick scene teleports restored
- scene quick-jumps enabled for lobby, table, seat, Reiki, PGA, legend, sponsor
- donor modular split preserved

## Phase 199 modular overlay
- SVR Wellness building ad refreshed to `SVR WELLNESS / L.A.` in neon green presentation styling.


## PHASE-224-QA-SHORTCUT-INDEX-LOCK
- Added exact best-five winning cards to showdown, history, and telemetry.


## PHASE-224-QA-SHORTCUT-INDEX-LOCK
- Adds side-pot eligibility and payout resolution.
- Emits `svr_poker_side_pot_resolution`.
- Keeps public Matrix page untouched.


## PHASE-224-QA-SHORTCUT-INDEX-LOCK

- Added folded/mucked player eligibility state.
- Folded players are excluded from side-pot winner eligibility.
- Added mucked/folded line to table hand-history panel.
- Added `svr_poker_fold_eligibility_update` event.
- Public Matrix page untouched.


## Phase 199
- PHASE-224-QA-SHORTCUT-INDEX-LOCK: dealer/blind state + safe rebuy continuity. Public page untouched.


## Phase 199
- PHASE-224-QA-SHORTCUT-INDEX-LOCK: player decision aid, pot-odds pressure hints, and backend telemetry hook. Public page untouched.
