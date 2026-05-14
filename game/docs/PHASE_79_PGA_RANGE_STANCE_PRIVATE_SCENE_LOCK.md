# PHASE-80-PGA-TARGET-BOUNTY-LOCAL-SCORE-LOCK

## Scope
Game-only update. Website/site files are not touched.

## PGA Driving Range lock
- PGA Drive is a standalone private scene at `game/range.html`.
- Added `game/pga-drive.html` as a redirect alias to the standalone range.
- The player starts on a visible gold **STAND HERE** mat.
- The ball is directly in front of the player for VR aiming/swinging.
- Added foot markers, gold aim line, and ball arrow.
- Desktop camera now starts on the mat looking toward the ball.
- Quest/WebXR local-floor origin is aligned so the tee mat/ball are in front of the player instead of behind them.

## Preserved
- Original lobby preserved.
- PGA lobby button/watch route opens the standalone range scene.
- Moon and Mars sky continuity remains active.
- Reiki approval lock remains clean.
- Store portal still points to `https://svrpoker.com/site/store.html`.
- No full PGA range is added into the main lobby.

## Test
- Open `game/index.html` and use **PGA Range**.
- Open `game/range.html` directly.
- In Quest, enter VR while physically standing on your play space; the gold mat and ball should appear in front of you.
