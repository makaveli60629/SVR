# PHASE-90-UNLOCKED-APPLY-BOOT-LOCK

Game-side only. Website/site untouched.

## Fixes

- Preserved the current lobby runtime instead of replacing it with a new `world.js` shell.
- Preserved the Phase 88 `spawnLogoTex` boot fix in `game/modules/world_skyline.js`.
- Added a safe boot fallback in `game/main.js` so a future world-build exception cannot leave the player in a black/green void.
- Added null-safe HUD/log/joint button guards so preview/embedded pages cannot crash if a control is absent.
- Preserved all private scene route files:
  - `reiki.html`
  - `pga-drive.html`
  - `chip-putt.html`
  - `store-room.html`
  - `smoker-lounge.html`
  - `scorpion.html`
  - `range.html`
- Store portal remains locked to `https://svrpoker.com/site/store.html`.
- Version labels updated to `PHASE-90-UNLOCKED-APPLY-BOOT-LOCK`.

## Safety locks

- Do not touch website/site side in this game track.
- Do not replace `game/index.html` with a simplified `world.js` runtime.
- Full Reiki/PGA/Smoker/Scorpion/Store scenes stay private routes, not embedded rooms inside the lobby.
- Unapproved Reiki sponsor/founder/website references remain blocked.
- Game package must remain under 25 MB.

## Validation

- JavaScript syntax checked with `node --check` for every game JS file.
- Relative JS imports audited.
- Required private route files present.
- ZIP rebuilt with normalized deploy permissions.
