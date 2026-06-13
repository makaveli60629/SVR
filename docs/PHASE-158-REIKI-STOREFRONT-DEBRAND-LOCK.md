# UPDATE-3.0-PHASE-158-REIKI-STOREFRONT-DEBRAND-LOCK

## Scope
Phase 158 removes the visible retired Reiki storefront branding reported in the latest Quest screenshot and sanitizes the active store catalog marker.

## Completed
- Added `game/modules/phase158_reiki_storefront_debrand_lock.js`.
- Wired the Phase 158 debrand lock into the active lobby wrapper after the sponsor registry.
- Hides legacy plane/circle panels in the Reiki storefront zone.
- Covers the retired storefront header/signage with clean placeholder signage.
- Replaces the visible storefront header with `REIKI HUB / SPONSOR PLACEHOLDER`.
- Replaces the visible presentation sign with `PLACEHOLDER / AWAITING OWNER APPROVAL`.
- Replaces visible side/storefront panels with placeholder-only sponsor registry panels.
- Replaces the floor portal text with `REIKI HUB / PLACEHOLDER`.
- Removes `ZEN DEN` from active `site/data/store-catalog.json` approval markers.
- Updates `game/index.html`, `game/phase141_label_fix.js`, and `game/version.json` to Phase 158.

## Site status
Active site pages were already cleaned in Phase 156/157. Phase 158 also sanitizes the active store catalog marker so the site data no longer says Zen Den.

## Rule
Reiki hub sponsor content must remain placeholder-only unless explicitly restored through the sponsor registry with owner approval.

## Files changed
- `game/modules/phase158_reiki_storefront_debrand_lock.js`
- `game/modules/reiki_phase119_trueitive_storefront_final.js`
- `site/data/store-catalog.json`
- `game/index.html`
- `game/phase141_label_fix.js`
- `game/version.json`
- `docs/PHASE-158-REIKI-STOREFRONT-DEBRAND-LOCK.md`

## Verification checklist
1. Open the game lobby.
2. Walk to the Reiki storefront.
3. Confirm the top sign says `REIKI HUB`, not the retired sponsor name.
4. Confirm the middle sign says `PLACEHOLDER`, not a retired sponsor presentation.
5. Confirm no `Zen Den` sign appears on the storefront.
6. Confirm the floor portal says `REIKI HUB / PLACEHOLDER`.
7. Confirm the site store catalog marker says `SPONSOR PLACEHOLDER ONLY`.
8. Confirm Phase 157 modular sponsor registry and Phase 155 skyline/moon glow remain intact.

## Locked label
`UPDATE-3.0-PHASE-158-REIKI-STOREFRONT-DEBRAND-LOCK`
