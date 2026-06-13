# UPDATE-3.0-PHASE-161-WELLNESS-HUB-LUXURY-STOREFRONT-LOCK

## Scope
Phase 161 rebuilds the old Reiki/Wellness storefront into a luxury Wellness Hub geometry storefront.

## Completed
- Added `game/modules/phase161_wellness_luxury_storefront.js`.
- Wired Phase 161 into the active lobby flow through the current wrapper.
- Visually renames the storefront to `WELLNESS HUB`.
- Removes the old event-style ropes/poles from the Wellness storefront zone by hiding legacy storefront objects in that area.
- Builds a luxury black-glass facade.
- Adds green/cyan/gold neon geometry framing.
- Adds a rounded luxury arch frame.
- Adds top sign: `WELLNESS HUB / LUXURY PLACEHOLDER`.
- Adds secondary sign: `SPONSOR PLACEHOLDER / REGISTRY CONTROLLED`.
- Adds left and right placeholder panels for About/Store.
- Adds a center integrated hologram carousel pod.
- Keeps the hologram module concept: one panel at a time, Back/Next controls, no video media.
- Adds a larger glowing Wellness floor portal.
- Updates loading screen, runtime label sync, post-boot verifier, and version metadata to Phase 161.

## Files changed
- `game/modules/phase161_wellness_luxury_storefront.js`
- `game/modules/reiki_phase119_trueitive_storefront_final.js`
- `game/index.html`
- `game/phase141_label_fix.js`
- `game/phase152_post_boot_verify.js`
- `game/version.json`
- `docs/PHASE-161-WELLNESS-HUB-LUXURY-STOREFRONT-LOCK.md`

## Verification checklist
1. Open the lobby and confirm build label shows Phase 161.
2. Go to the Wellness/Reiki storefront area.
3. Confirm the storefront now reads `WELLNESS HUB`.
4. Confirm old red ropes and old poles are removed/hidden in this zone.
5. Confirm the new facade uses black glass with green/cyan/gold geometry.
6. Confirm the Wellness hologram carousel floats at the center and uses Back/Next controls.
7. Confirm no sponsor name, sponsor site, or video media appears.
8. Confirm Phase 160 planets/starfield and Phase 159 VIBEZ storefront remain intact.

## Locked label
`UPDATE-3.0-PHASE-161-WELLNESS-HUB-LUXURY-STOREFRONT-LOCK`
