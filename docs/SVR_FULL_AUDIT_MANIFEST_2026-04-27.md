# SVR Poker Full Audit Manifest — 2026-04-27

## Scope
Audited local packages available in this chat:
- `/mnt/data/game.zip` current deploy game package
- `/mnt/data/SVR-main.zip` repo snapshot
- supporting assets: logo files, Eric FBX, male sitting pose FBX, locomotion packs, NPC stool pack

Site package was not modified.

## Current Package Status
- `game.zip` is about 23 MB, under the 25 MB target.
- Archive contains 118 entries and about 32.6 MB uncompressed.
- Main game path is `game/` with `index.html`, `main.js`, `manifest.json`, `cam3.html`, `preview.html`, `modules/`, `assets/`, and `docs/`.
- Game is structured as a browser Three.js/WebXR project.
- Audio files are present: `07.mp3`, `reiki_time_hub.mp3`, `svr_after_dark.mp3`.
- Main world source is concentrated in `modules/world_skyline.js`, currently over 114 KB.

## Repo / Deploy Findings
- `SVR-main.zip` includes `.github/workflows/deploy.yml`.
- Workflow copies repo into `build/`, excludes `.git`, `.github`, and `update`, then overlays `update/site.zip` and `update/game.zip`.
- `update/game.zip` is flattened into `build/game`.
- No permission-normalization step is present after unzip, so bad zip permissions can still break deploy.
- Current repo snapshot appears thin compared with the packaged game. The live game should continue shipping through `update/game.zip` until repo/game source is fully reconciled.

## Scene / Hub Findings
### Enabled / Present
- Main lobby / skyline room exists.
- Table scene target exists through quick scene navigation.
- Seat scene target exists.
- Reiki scene target exists.
- Second Reiki / Zen Den scene target exists as `reikiRoom` / `ZEN DEN`.
- PGA hub module exists at `modules/hubs/pga_hub.js`.
- Sponsor, Legends, and Scorpion targets are referenced.
- Wrist watch quick-jump buttons include Lobby, Table, Seat, Reiki, PGA, Legend, Sponsor, Scorpion, and Zen Den.
- Desktop quick keys include Digit 1 through Digit 9 for scene jumps.

### Naming Issue
- Asset folder is still named `assets/models/riki/` while game text/UI mostly says `Reiki`.
- This is not fatal if code references match, but it is a cleanup risk. Standardize future public labels to `Reiki`; internal folder can be migrated later with careful path updates.

## Runtime / UX Findings
- Watch exists and has multiple quick-scene buttons.
- Controller/hand systems exist through `hands.js`, `teleport.js`, and `watch.js`.
- Audio starts after user/session interaction and includes watch/desktop controls.
- Live preview / CAM3 mode exists through `cam3.html`, `preview.html`, URL params, and AUTOCAM logic.

## Primary Risks / Errors To Fix
1. **Deploy hardening missing**
   - Add `chmod -R u+rwX,go+rX tmp || true` after unzip in workflow.
2. **World file too large / too centralized**
   - `world_skyline.js` should be split into modules: lobby shell, Reiki hub, Zen Den, PGA, planets/sky, table, bots, sponsor walls.
3. **Reiki naming inconsistency**
   - Public UI should always say `Reiki`; folder path `riki` should be left alone until a safe refactor or changed everywhere together.
4. **Performance pressure**
   - Multiple FBX/GLB files, large world script, animated canvas textures, particles/sprites, lights, and large textures may hurt Quest performance.
5. **FBX reliance**
   - FBX should be converted to GLB where possible for faster runtime loading and more stable web delivery.
6. **Scene target validation needed**
   - Quick jumps exist, but final pass should verify each target lands in correct position and camera faces correct content.
7. **Game loop polish incomplete**
   - Poker demo exists, but full gameplay state machine, betting rounds, chip accounting, and dealer animation are still next-phase work.
8. **Watch interaction risk**
   - Watch has many buttons; hit areas and orientation should remain locked, tested seated/standing/in XR.
9. **Visual identity cleanup needed**
   - Some older labels/docs still refer to mixed phase states. Need one current production manifest and one source of truth.

## Recommended Fix Order
### Phase 1 — Safety + Manifest Lock
- Add deploy permission hardening.
- Add this audit manifest to `game/docs/`.
- Add a `SCENE_STATUS.md` file listing enabled scenes.
- Add package validation checklist.

### Phase 2 — Scene Validation Pass
- Confirm Lobby, Table, Seat, Reiki storefront, Reiki Zen Den, PGA, Sponsor, Legends, and Scorpion quick jumps.
- Add visible floor labels / portals only where useful.
- Verify player spawn faces north / correct lobby reference.

### Phase 3 — Performance Pass
- Clamp Quest pixel ratio.
- Disable shadows by default.
- Reduce sprite count.
- Cap emissive intensities.
- Convert FBX to GLB where safe.
- Compress large textures.

### Phase 4 — Gameplay Upgrade
- Dealer state machine.
- Deal animation timing.
- Chip stack interactions.
- Bet/call/fold/check UI.
- Basic round flow.
- Table messages and winner reveal.

### Phase 5 — Beauty / Wow Pass
- Neon skyline depth.
- Hologram sponsor wall.
- VIP portal room.
- Reiki breathing ring.
- PGA swing hologram.
- Table-side cinematic camera.
- Particle effects with strict performance budget.

## Cool Feature Ideas
1. **SVR Portal Wheel**
   - A circular teleport hub on the floor with glowing icons for Poker, Reiki, PGA, Sponsor, Scorpion, and Legends.
2. **Reiki Breathing Ring**
   - A slow pulsing halo in Zen Den synchronized with calm audio.
3. **PGA Swing Ghost**
   - A transparent golfer silhouette showing a smooth swing loop inside PGA hub.
4. **Dealer Spotlight Moment**
   - When a hand starts, lights dim, table glows, dealer animation starts.
5. **Live Director Cam**
   - Keep CAM3 as a cinematic preview showing the best angle while testing.
6. **Sponsor Ad Rotation**
   - Building ads rotate every 20–30 seconds using canvas textures.
7. **Quest Comfort Mode**
   - Low glow, low motion, snap turn, teleport-first mode for smooth VR comfort.
8. **Mission Board**
   - A wall that explains SVR Poker: tournaments, giving back, sponsors, wellness, PGA, and future rooms.

## Immediate Next Action
Build the next `game.zip` as a safety/manifest/scene-status phase:
- leave site alone
- keep under 25 MB
- include deploy-safe permissions
- include audit manifest in `game/docs/`
- add scene status/checklist docs
- add small workflow patch instructions
