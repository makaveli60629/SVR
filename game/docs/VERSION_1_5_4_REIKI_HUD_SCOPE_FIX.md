# Version 1.5.4 - Reiki HUD Scope Fix

## Scope
Game side only.

## Fix
- Removes the bad global Reiki carousel popup from the loading/lobby screen.
- Replaces it with a compact Reiki storefront HUD.
- HUD is closed by default and opens only when a Reiki storefront/portal trigger is selected.
- Video slide uses a long frame with object-fit contain so faces do not stretch wide.
- Android controller/touch overlays are smart-device only and hidden on desktop.
- Old floor/bottom labels such as "Reiki Hologram Carousel" are hidden when detected.

## Protected
- Website/site untouched.
- Existing Reiki runtime files hash-protected.
- Lobby is not rebuilt.
- No unapproved external Reiki/founder branding is inserted.

## Test
https://svrpoker.com/game/?v=1-5-4-reiki-hud-scope-fix
