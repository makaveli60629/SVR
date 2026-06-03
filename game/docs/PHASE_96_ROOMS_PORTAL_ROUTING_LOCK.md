# Phase 96 — Rooms + Portal Routing Lock

Game-side-only patch. Website files remain untouched.

## Audit result
- Current package was an older lobby build with working lobby/watch basics.
- Private room HTML files were missing.
- Bottom HUD and watch still used older labels such as Table and Zen Den.
- Unapproved Reiki/Trueitive runtime references were present in the lobby world module and assets.

## Fixed
- Added private scene files:
  - `game/reiki.html`
  - `game/pga-drive.html`
  - `game/range.html`
  - `game/chip-putt.html`
  - `game/store-room.html`
  - `game/smoker-lounge.html`
  - `game/scorpion.html`
- Added shared private-scene module:
  - `game/modules/private_scene_common.js`
- Updated lobby bottom scene buttons for storefront/private-room routing.
- Updated watch quick buttons for storefronts and private rooms.
- Store portal points to `https://svrpoker.com/site/store.html`.
- Reiki storefront now uses SVR placeholder / AWAITING APPROVAL panels only.
- Removed unapproved Reiki/Trueitive assets from runtime package.
- Preserved current lobby baseline, poker table, watch, teleport, Moon/Mars, and game-side-only scope.

## Route lock
- Lobby = storefront portals only.
- Reiki Room, PGA Drive, Chip/Putt, Store, Smoker Lounge, and Scorpion open as private scene pages.
- Site remains handled by the website track.

## Build label
`PHASE-96-ROOMS-PORTAL-ROUTING-LOCK`
