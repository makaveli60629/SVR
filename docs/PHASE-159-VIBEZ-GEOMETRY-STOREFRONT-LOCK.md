# UPDATE-3.0-PHASE-159-VIBEZ-GEOMETRY-STOREFRONT-LOCK

## Scope
Phase 159 rebuilds the VIBEZ Theater storefront in geometry using the black/cyan stacked storefront style requested from the latest screenshot reference.

## Completed
- Added `game/modules/phase159_vibez_geometry_storefront.js`.
- Wired Phase 159 into the active lobby wrapper after Phase 158.
- Hides the older Vibes Theater storefront before drawing the new geometry storefront.
- Builds a black glass storefront facade with cyan and purple neon frame geometry.
- Adds stacked storefront signs:
  - `VIBEZ THEATER / GEOMETRY STOREFRONT`
  - `VIBEZ PRESENTATION / MOVIE • MUSIC • EVENTS`
- Adds center screen/poster geometry panels.
- Adds side poster panels for lounge/events.
- Adds marquee bulbs across the top header.
- Adds a purple theater carpet with cyan trim.
- Adds a circular VIBEZ floor portal texture.
- Keeps Vibes Theater excluded from the sponsor registry.
- Updates `game/index.html`, `game/phase141_label_fix.js`, `game/phase152_post_boot_verify.js`, and `game/version.json` to Phase 159.

## Files changed
- `game/modules/phase159_vibez_geometry_storefront.js`
- `game/modules/reiki_phase119_trueitive_storefront_final.js`
- `game/index.html`
- `game/phase141_label_fix.js`
- `game/phase152_post_boot_verify.js`
- `game/version.json`
- `docs/PHASE-159-VIBEZ-GEOMETRY-STOREFRONT-LOCK.md`

## Verification checklist
1. Open the lobby and confirm build label shows Phase 159.
2. Go to the VIBEZ Theater storefront.
3. Confirm the older blue flat storefront is replaced/hidden.
4. Confirm the new facade is geometry: black wall, glass pane, neon trim, posts, marquee bulbs, carpet, and portal.
5. Confirm top sign reads `VIBEZ THEATER`.
6. Confirm second sign reads `VIBEZ PRESENTATION`.
7. Confirm Vibes Theater is still excluded from the sponsor registry.
8. Confirm Phase 158 Reiki debrand, Phase 155 skyline/moon glow, Quest hands, teleport, watch, and poker baseline remain intact.

## Locked label
`UPDATE-3.0-PHASE-159-VIBEZ-GEOMETRY-STOREFRONT-LOCK`
