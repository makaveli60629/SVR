# Phase 84E — Always Visible Espresso Ad Lock

Game-side only. Website untouched.

## Fix
- Adds a dedicated front-row center building for the ESPRESSO WITH CREAM ad.
- Places the ad on the front face from the player/table view.
- Uses depthTest=false only on the ad/frame so foreground skyline blockers cannot hide the sponsor art.
- Keeps older skyline building grid intact but gives Espresso a guaranteed visible placement.
- Preserves Reiki approval lock: SVR / AWAITING APPROVAL only; no unapproved sponsor/founder references.
- Preserves controller lock: right stick Y forward/back and right stick X 45-degree snap turn.

## Test
Open `/game/?v=phase84e-espresso-visible`, sit/stand at the table, look at the center skyline. The Espresso ad should be visible on the front-center ad building, not hidden behind purple/blue towers.
