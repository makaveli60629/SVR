# UPDATE-3.0-PHASE-153-NATURAL-PLANET-SCALE-LOCK

## Scope
Phase 153 corrects the oversized planets while keeping them visible in the north sky.

## Completed
- Reduced Earth scale from Phase 150 oversized presentation to a smaller background planet.
- Reduced Moon scale from `2.05` to `0.72`.
- Reduced Mars scale from `1.78` to `0.62`.
- Reduced planet halo sizes and opacity so the glow does not dominate the lobby.
- Kept Moon and Mars in the visible north-sky band.
- Preserved uncullable visibility so planets do not disappear unexpectedly.
- Preserved extra-thin silver poles.
- Preserved no-overlay storefront cleanup.
- Preserved cleaner skyline buildings.
- Updated loading screen, HUD build label, runtime label sync, post-boot verifier label, and version metadata to Phase 153.

## Files changed
- `game/index.html`
- `game/phase141_label_fix.js`
- `game/phase152_post_boot_verify.js`
- `game/version.json`
- `game/modules/phase149_visual_refinement.js`
- `docs/PHASE-153-NATURAL-PLANET-SCALE-LOCK.md`

## Verification checklist
1. Open the lobby and confirm the build label shows Phase 153.
2. Look north and slightly up.
3. Confirm Moon and Mars are visible but no longer oversized.
4. Confirm the planet glow is subtle and not washing out the scene.
5. Confirm extra-thin silver poles and no-overlay storefront are still intact.
6. Confirm skyline buildings still look cleaner and farther back.
7. Confirm Quest hands, controller fallback, teleport, watch, and scene jumps still function.

## Locked label
`UPDATE-3.0-PHASE-153-NATURAL-PLANET-SCALE-LOCK`
