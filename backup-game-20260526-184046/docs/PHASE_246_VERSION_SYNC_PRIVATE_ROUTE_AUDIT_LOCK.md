# Phase 247 — Direct Deploy + Route Verify Lock

## Scope
Game-side only. This phase stops phase-label drift and locks the direct-deploy structure.

## Locked
- Build label: `PHASE-247-DIRECT-DEPLOY-ROUTE-VERIFY-LOCK`
- Website/site side untouched.
- Main lobby preserved.
- Reiki/PGA/Store/Smoker/Scorpion remain private scene routes.
- Store portal target remains `https://svrpoker.com/site/store.html`.
- No unapproved Reiki sponsor, founder, external wellness URL, or founder-photo references.
- Package remains under 25 MB.

## Why this phase matters
The GitHub Pages workflow deploys the committed `/game` folder directly and excludes `/update` and `*.zip` from the public build. Therefore every phase must update both the committed `/game` folder and `update/game.zip` during upload.

## Test URLs
- `/game/?v=phase246`
- `/game/reiki.html?v=phase246`
- `/game/pga-drive.html?v=phase246`
- `/game/chip-putt.html?v=phase246`
- `/game/store-room.html?v=phase246`
- `/game/smoker-lounge.html?v=phase246`
- `/game/scorpion.html?v=phase246`
