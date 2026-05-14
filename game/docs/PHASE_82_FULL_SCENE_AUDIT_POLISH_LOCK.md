# Phase 83 — Full Scene Audit + Polish Lock

Game-side only. Website/site files remain untouched.

## Audit result
- Current repo deploy copies committed files directly and excludes `update/` and `*.zip`, so this package updates both `/game` and `update/game.zip` for safety.
- Previous rollback narrowed routes to the Reiki Phase 80 path, which caused several scene buttons to disappear or stop routing.
- Phase 83 restores route coverage and adds a runtime audit object: `window.SVR_PHASE82_ROUTE_AUDIT`.

## Restored / locked buttons
- Lobby
- Table
- Seat
- Reiki Portal
- Reiki Private
- PGA Portal
- PGA Drive Range
- PGA Chip/Putt
- Smoker Lounge
- Scorpion Room
- Legend
- Sponsor
- VR Store Portal
- VR Store Room
- Open Web Store

## Restored scene files
- `game/reiki.html`
- `game/range.html`
- `game/pga-drive.html`
- `game/chip-putt.html`
- `game/smoker-lounge.html`
- `game/scorpion.html`
- `game/store-room.html`

## Visual fixes
- Added forced high-sky textured Moon and Mars with glow/radiance in the lobby.
- Preserved Moon/Mars in private scenes via `private_scene_common.js` and the PGA range sky.
- Added a guaranteed in-game SVR Store web portal panel near the store route.

## Protected
- Site untouched.
- Original lobby preserved.
- Private scenes stay separate from the lobby.
- Reiki approval lock preserved.
- Package remains under 25 MB.
