# UPDATE-3.0-PHASE-164-LEGENDS-STATUES-COMPACT-LOBBY-WALLS-LOCK

## Scope
Phase 164 adds armored display figures to the Legends storefront and makes the lobby feel smaller by tightening the storefront ring and closing the lobby walls closer to the HUD/storefront line.

## Completed
- Added `game/modules/phase164_legends_statues_compact_walls.js`.
- Wired Phase 164 into the active lobby wrapper after Phase 163.
- Added two armored Legends Hall statue displays inspired by the latest reference image.
- Added Legends plaques and a new `LEGENDS HALL / ARMORED HALL OF FAME` sign.
- Moved the hub storefront ring closer to the center.
- Scaled the storefront groups down slightly for a tighter lobby feel.
- Added compact close wall panels around the hub/HUD ring.
- Added upper and lower cyan wall trims to visually close the lobby.
- Preserved the Phase 163 realistic storefront layout and HUD interaction logic.
- Updated `game/index.html`, `game/phase141_label_fix.js`, `game/phase152_post_boot_verify.js`, and `game/version.json` to Phase 164.

## Files changed
- `game/modules/phase164_legends_statues_compact_walls.js`
- `game/modules/reiki_phase119_trueitive_storefront_final.js`
- `game/index.html`
- `game/phase141_label_fix.js`
- `game/phase152_post_boot_verify.js`
- `game/version.json`
- `docs/PHASE-164-LEGENDS-STATUES-COMPACT-LOBBY-WALLS-LOCK.md`

## Verification checklist
1. Open the lobby and confirm the build label shows Phase 164.
2. Go to the Legends storefront and confirm two armored statue displays are visible.
3. Confirm the Legends sign says `LEGENDS HALL / ARMORED HALL OF FAME`.
4. Confirm the lobby ring feels tighter and the storefronts are closer to the center.
5. Confirm the new compact walls sit closer behind the storefront/HUD ring.
6. Confirm hub signs and HUDs still face inward toward the lobby.
7. Confirm Phase 163 storefronts, Phase 160 planets/starfield, Quest movement, teleport, watch, and poker baseline remain intact.

## Locked label
`UPDATE-3.0-PHASE-164-LEGENDS-STATUES-COMPACT-LOBBY-WALLS-LOCK`
