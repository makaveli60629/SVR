# Phase 83 — Direct Scene Route Verify Lock

Game-side only. Website/site files are untouched.

## Why this exists
The prior apply failed because Windows/Downloads supplied a stale `game.zip` that did not contain the expected Phase 82 build label. This Phase 83 package uses a unique filename and the apply script verifies the nested `game/index.html` label before replacing the committed `/game` folder.

## Restored and verified
- Moon and Mars high-sky textured/glow objects.
- PGA Driving Range: `game/range.html` and `game/pga-drive.html`.
- PGA Chip/Putt: `game/chip-putt.html`.
- Reiki private scene: `game/reiki.html`.
- Smoker Lounge: `game/smoker-lounge.html`.
- Scorpion Room: `game/scorpion.html`.
- VR Store Room: `game/store-room.html`.
- In-lobby VR Store portal panel and web store route.

## Deployment rule
Current workflow deploys committed `/game` directly and excludes `update/` and `*.zip`, so this package must replace both `/game` and `update/game.zip`.
