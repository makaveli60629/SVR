# Phase 80 — PGA Target Bounty Local Score Lock

Build: `PHASE-80-PGA-TARGET-BOUNTY-LOCAL-SCORE-LOCK`

## Scope
Game-only update. Website/site remains untouched. Original lobby remains preserved.

## PGA Range
- Keeps PGA Driving Range as a standalone private scene: `game/range.html`.
- Keeps alias route: `game/pga-drive.html`.
- Keeps player spawn on the gold `STAND HERE / AIM AT BALL` mat facing the ball.
- Adds local target bounty scoring for the range.

## Local Target Bounty
- 100-yard target = +100 local training points.
- 200-yard target = +200 local training points.
- 300-yard target = +300 local training points.
- Score is stored locally in browser localStorage.
- No poker wallet connection.
- No real-money connection.
- No backend/API call.

## Locks Preserved
- Moon and Mars high and visible in lobby and private scenes.
- Store portal route preserved: https://svrpoker.com/site/store.html
- Reiki approval lock preserved with no unapproved branding.
- Quest controller fallback and hand-tracking teleport fallback preserved.
- Package remains under 25 MB.
