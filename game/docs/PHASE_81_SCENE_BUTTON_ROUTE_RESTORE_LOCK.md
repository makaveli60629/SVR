# Phase 81 — Scene Button Route Restore Lock

Game-side-only rollback repair. Website/site files are untouched.

## Audit result
The rollback restore left the live `game/` folder on a narrow Reiki-only Phase 80 path. The lobby bottom buttons and standalone private scene files for PGA Drive, Chip/Putt, Smoker Lounge, Scorpion, and VR Store were missing or unreachable.

## Fixed
- Restored the full bottom scene button set.
- Restored `range.html` and `pga-drive.html` for PGA Drive.
- Restored `chip-putt.html` fallback for short game.
- Restored `smoker-lounge.html` fallback.
- Restored `scorpion.html` fallback.
- Restored `store-room.html` fallback.
- Restored `reiki.html` fallback.
- Added `SCENE_URL_FALLBACKS` in `main.js` so buttons still open a real private scene if an in-world scene target is unavailable.
- Preserved original lobby, watch, controls, Moon/Mars/stars, and PGA local target scoring.

## Required test list
- Lobby
- Table
- Seat
- Reiki Portal
- Reiki Private
- PGA Portal
- PGA Range
- Chip/Putt Room
- Smoker Lounge
- Scorpion Room
- Legend
- Sponsor
- Store Portal
- Store Scene
- Open Web Store
