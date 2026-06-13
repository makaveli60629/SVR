# UPDATE-3.0-PHASE-163-REALISTIC-LOBBY-STOREFRONT-ALIGNMENT-LOCK

## Scope
Phase 163 refines the lobby into a smaller, aligned, realistic storefront ring and corrects HUD alignment/professional structure.

## Research-backed design rules used
- Real storefronts use a facade/entryway with display windows to attract attention and present the business clearly.
- Retail spaces should draw people in with a storefront that acts like a billboard and should maintain unified design across chain-style spaces.
- Visual merchandising relies on lighting, color, space, product information, and window display clarity.

## Completed
- Added `game/modules/phase163_realistic_lobby_storefront_alignment.js`.
- Wired Phase 163 into the active lobby wrapper after Phase 162.
- Hides older Phase 157-162 hub storefront layers so broken/dark/unaligned HUD fragments do not remain visible.
- Rebuilds the lobby into a compact aligned storefront ring with hubs closer to the lobby center.
- Adds a compact central plaza ring and lobby directory board.
- Rebuilds these storefronts as realistic facade-style storefronts:
  - Wellness Hub
  - PGA Hub
  - VIBEZ Theater
  - SVR Store
  - Scorpion Room
  - Legends Hall
  - Charity Hub
  - Sponsor Hub
- Adds realistic storefront components:
  - black architectural facade
  - glass display windows
  - double-door entry structure
  - sidewalk/plinth base
  - canopy/awning mass
  - pilasters/vertical trim
  - readable top signage
  - left/right display posters
  - entry carpet
  - circular hub floor marker
- Rebuilds the HUD buttons for each storefront:
  - OPEN
  - INFO
  - NEXT
- Adds Z-axis button compression on interaction.
- Updates `game/index.html`, `game/phase141_label_fix.js`, `game/phase152_post_boot_verify.js`, and `game/version.json` to Phase 163.

## Files changed
- `game/modules/phase163_realistic_lobby_storefront_alignment.js`
- `game/modules/reiki_phase119_trueitive_storefront_final.js`
- `game/index.html`
- `game/phase141_label_fix.js`
- `game/phase152_post_boot_verify.js`
- `game/version.json`
- `docs/PHASE-163-REALISTIC-LOBBY-STOREFRONT-ALIGNMENT-LOCK.md`

## Verification checklist
1. Open the lobby and confirm build label shows Phase 163.
2. Confirm the lobby feels more compact, with storefronts aligned in a ring around the center.
3. Confirm Wellness, PGA, VIBEZ, Store, Scorpion, Legends, Charity, and Sponsor all face inward toward the lobby.
4. Confirm each storefront has glass display windows, double doors, canopy/signage, and aligned HUD buttons.
5. Confirm older broken/dark floating panels are not visible in front of the storefronts.
6. Confirm OPEN / INFO / NEXT buttons compress and return when pressed/clicked.
7. Confirm VIBEZ still keeps its entertainment identity while being aligned into the ring.
8. Confirm planets/starfield, Quest movement, teleport, watch, and poker table baseline remain intact.

## Locked label
`UPDATE-3.0-PHASE-163-REALISTIC-LOBBY-STOREFRONT-ALIGNMENT-LOCK`
