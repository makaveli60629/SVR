# SVR Poker — Phase 28 Audit Report

Date: 2026-05-08  
Audited package: `/mnt/data/game.zip` / Phase 28 Table Dealer Sky Gravity build

## Executive status

The Phase 28 ZIP is deployable and under the 25 MB limit, but it is **not clean enough to be treated as the new master baseline yet**.

### Pass
- ZIP size is under 25 MB.
- ZIP permissions are valid; no missing execute bits on directories were found.
- JavaScript syntax check passed for all packaged `.js` files.
- Package structure is compatible with the current GitHub Pages overlay workflow.
- The real-lobby style build is present.
- Watch, teleport, poker demo, skyline, and PGA hub modules exist.

### Blockers
1. **Unapproved Trueitive assets and code references are still inside the package.**
2. **Visible dealer rig code is still present in `world_skyline.js`, even though the requested behavior is invisible dealer only.**
3. **Private scene routing is incomplete compared to the locked plan.**
4. **PGA is still a storefront/scaffold, not a real controller-swing golf module.**
5. **Multiplayer is not implemented yet.**
6. **The repo is very large; long-term stability needs repo cleanup and release discipline.**

---

## Package audit

### ZIP
- File: `game.zip`
- Size: about 23 MB
- Entries: 120
- Top-level folder: `game/`
- Deploy compatible: yes

### JavaScript syntax
Checked:
- `main.js`
- `modules/asset_base.js`
- `modules/audio.js`
- `modules/config.js`
- `modules/core_scene.js`
- `modules/desktop_controls.js`
- `modules/gestures.js`
- `modules/hands.js`
- `modules/hubs/pga_hub.js`
- `modules/poker_demo.js`
- `modules/teleport.js`
- `modules/utils.js`
- `modules/watch.js`
- `modules/world_skyline.js`

Result: **pass**

---

## Critical brand/compliance issue

The following unapproved Trueitive files are still packaged:

```text
assets/ui/trueitive-founder.png
assets/ui/trueitive-instagram-ad.jpg
assets/ui/trueitive-logo.png
assets/ui/trueitive-zen-ad.jpg
docs/PHASE_42_TRUEITIVE_LA_AD.md
docs/PHASE_90_REIKI_TRUEITIVE_WATCH_TELEPORT.md
```

The following runtime code still references Trueitive assets/text:

```text
modules/world_skyline.js
```

Findings:
- `trueitive-logo.png` is loaded.
- `trueitive-founder.png` is loaded.
- `trueitive-instagram-ad.jpg` is loaded.
- `trueitive-zen-ad.jpg` is loaded.
- `trueitive.com` text still appears in generated signage.

Required fix:
- Remove all Trueitive runtime assets.
- Replace Reiki signage with neutral approved wording:
  - `REIKI WELLNESS HUB`
  - `Private Meditation Room`
  - `Sponsor partner pending approval`
- Keep the Reiki module, but remove sponsor-specific identity unless explicitly approved.

---

## Poker / table audit

### Requested behavior
- Deal left-to-right.
- Six main player seats.
- One open seat for the player.
- No visible dealer body.
- Invisible dealer logic only.

### Current status
- Poker logic exists in both:
  - `modules/poker_demo.js`
  - `modules/world_skyline.js`

Concern:
- Dealer body/rig setup still exists in `world_skyline.js`:
  - Eric FBX load path exists.
  - dealer actor, dealer anchor, animation mixer, and pose controls still exist.
  - This may cause a visible dealer to appear if assets load.

Required fix:
- Remove or fully disable visible dealer mesh loading.
- Keep only:
  - invisible dealer source position
  - dealer button marker
  - card source vector
  - table state logic
- Make the open player seat a named locked seat:
  - `PLAYER_OPEN_SEAT_SOUTH`

---

## Sky audit

### Requested behavior
- Moon and Mars high in sky.
- Far enough from buildings.
- Large enough to see.
- No visual collision with buildings during orbit.

### Current status
- Moon and Mars are placed high and far:
  - Moon Y: wall height + 178
  - Mars Y: wall height + 196
  - Far negative Z offsets
- Orbit/rotation exists.

Required next test:
- Confirm in headset that objects are not too far/faint.
- Confirm no halo flicker on Quest.
- Confirm they do not cross skyline during movement.

---

## Physics / chip gravity audit

Current Phase 28 added a test-level chip toss gravity scaffold.

Required next step:
- Move from keyboard `G` demo toss to actual VR interaction:
  - trigger grab chip
  - release throw chip
  - table collision
  - chip bounce/slide
  - impact sound
  - despawn/settle cleanup
- This should become a standalone module:
  - `modules/physical_table_props.js`

---

## PGA audit

### Current status
- PGA hub module exists:
  - `modules/hubs/pga_hub.js`
- Juan Espejo image asset exists:
  - `assets/ui/juan-espejo.jpg`

### Missing
- No real club controller module yet.
- No swing speed calculation.
- No ball launch model.
- No carry/roll/scoring board.
- No separate module boundaries for:
  - Driving range
  - Chip/Putt
  - Putting
  - Swing trainer

Recommended module plan:
```text
modules/pga/
  pga_range_scene.js
  club_controller.js
  golf_ball_physics.js
  shot_scoring.js
  pga_ui_board.js
  manifest.json
```

---

## Multiplayer audit

Current status:
- No multiplayer adapter found.
- No socket client found.
- No Firebase/Supabase/WebSocket room code found.
- GitHub Pages can host the static demo, but it cannot host real authoritative multiplayer/server logic.

Recommended temporary startup stack:
- Frontend still on GitHub Pages or static hosting.
- Backend on a small Node/WebSocket service.
- State authority:
  - server owns seats, turns, pot, cards, chip deltas
  - client renders lobby/table/player movement

Suggested low-cost startup options:
- Render
- Railway
- Fly.io
- DigitalOcean App Platform
- VPS later for full enterprise control

---

## GitHub / deployment audit

Current workflow:
- Builds from the repo.
- Excludes `update`, `backend`, `docs`, `modules`, `*.zip`, `*.fbx`.
- Then overlays `update/site.zip` and `update/game.zip`.
- This means runtime FBX/assets must be inside `update/game.zip` if needed live.

Recommended workflow hardening:
- Add `chmod -R u+rwX,go+rX tmp || true` immediately after unzip.
- Add a size check for `update/game.zip`.
- Add a basic package validation step:
  - `test -f build/game/index.html`
  - optional JS syntax check for packaged modules

---

## Repo discipline issue

GitHub repo metadata reports a very large repository size. The project should stop treating old binary ZIPs as permanent history.

Recommended fix:
- Continue shipping only `update/game.zip`.
- Keep human-readable manifests in repo.
- Move historical large backup ZIPs outside git history where possible.
- Long-term: use GitHub Releases or cloud storage for phase archives.

---

## Required permanent architecture

Every major feature should be a removable module:

```text
modules/
  core/
  poker/
  pga/
  reiki/
  smoker_lounge/
  scorpion_room/
  vr_store/
  sponsor_system/
  table_physics/
  multiplayer/
  audio/
  sky/
  routing/
```

Each module should contain:
```text
manifest.json
index.js
assets/
README.md
enabled flag
approved branding flag
```

Branding rule:
- If sponsor approval is missing, module remains neutral or disabled.
- Removal must not break lobby boot.

---

## Recommended next phase

### Phase 29 — Clean Master Lock

Before adding PGA or multiplayer, fix the baseline:

1. Remove Trueitive assets/code/text completely.
2. Disable/remove visible dealer rig load.
3. Split poker table logic into a clearer module.
4. Add `PROJECT_STATE_LOCK.json`.
5. Add `MODULE_REGISTRY.json`.
6. Harden deploy workflow or provide a patch.
7. Keep game under 25 MB.
8. Keep site untouched.

After Phase 29 is clean, proceed:

### Phase 30 — PGA Club Controller
- Controller as club.
- Ball physics.
- Driving bay.
- Shot scoring.

### Phase 31 — VR Physical Table Props
- Grab chips/cards.
- Throw chips.
- Card peek.
- Chip/card SFX.

### Phase 32 — Multiplayer Prototype
- WebSocket backend.
- Seat sync.
- Name tags.
- live preview spectator feed.

---

## Bottom line

The game is recoverable and the current package is technically deployable.  
The next build should not add new visuals yet. It should become the clean master baseline:

**brand-safe, modular, dealer-invisible, scene-routed, manifest-driven, and deploy-hardened.**
