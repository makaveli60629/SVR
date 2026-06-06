# SVR Poker Game Manifest

## Purpose
This folder preserves working state, priorities, and handoff notes so progress is not lost between phases.

## Current locked version
**UPDATE-1.5-STABILITY-BUILD**

Update 1.5 is the current working target. Numeric phase names are now subordinate labels only. Do not roll the repo backward to Phase 84 when the active goal is Update 1.5.

## Current package baseline
Current repo baseline:
- `main` branch
- Game boot path: `game/index.html`
- Game-only track
- Site and public website remain locked and must not be edited in this game track.

## Locked baselines
- Official forearm watch baseline remains the reference watch.
- Watch screen should face the user/upward and stay readable.
- Correct spelling is **Reiki**.
- Reiki public/sponsor branding remains approval-safe unless explicitly approved.
- Use secure API architecture for data. Do not expose backend/database/payment/admin secrets in browser code.
- Game modules must remain removable/swappable.
- Private rooms must remain separate scenes/routes, not full rooms embedded inside the lobby.
- Quest, Android, and desktop locomotion must remain locked modules, not scattered across unrelated files.

## Current implemented areas
- Main lobby shell
- Live game preview route
- Store/site/game bridge route
- Private room portal hub
- Scorpion private room route
- Reiki private room route
- PGA Drive private room route
- Chip/Putt private room route
- VR Store private room route
- Smoker Lounge private room route
- Camera-forward locomotion module
- Teleport release commit guard
- Moon and Mars sky polish track
- Reiki approval-safe hub polish track

## Update 1.5 control lock
- Android movement is working and must not be touched unless explicitly requested.
- Desktop movement is working and must not be touched unless explicitly requested.
- Quest controller movement needs the active fix path:
  - right stick up/down = camera-facing forward/back movement
  - right stick left/right = 45-degree snap turn
  - no sideways drift when the headset is turned 45 degrees
- Quest controllers should be visible as controllers.
- Grip/squeeze should show teleport ray and SVR logo marker.
- Trigger should commit teleport/leap when teleport is aimed.
- A button should toggle action laser.
- Trigger while action laser is active should activate UI/raycastable buttons.
- Hand/fist teleport is secondary after controller stability.

## Moon and Mars lock
- Remove duplicate geometry-only Moon/Mars props.
- Use textured planet meshes only.
- Moon must be bigger and higher.
- Mars must be slightly bigger and higher.
- Mars should orbit the Moon.
- Add denser stars and lightweight constellation clusters.
- Keep sky objects above the skyline and away from building collision.

## Private room routes
- `game/scorpion.html`
- `game/reiki.html`
- `game/pga-drive.html`
- `game/chip-putt.html`
- `game/store-room.html`
- `game/smoker-lounge.html`

## Site/game/data target
- Site stays professional and locked.
- Game uses bridge/fallback data for profile, rooms, ads, store products, manifest, and game events.
- Secure API default remains external to browser secrets.
- Browser code must never include private database credentials, Stripe/payment secrets, or admin secrets.

## Current priority order
1. Fix deploy/workflow extraction so Update 1.5 can publish reliably.
2. Sync build labels away from Phase 84 and into Update 1.5.
3. Verify Quest controller camera-forward locomotion.
4. Verify grip teleport marker and trigger commit.
5. Verify A-button action laser and trigger activation.
6. Verify Moon/Mars scale, height, texture, orbit, and duplicate removal.
7. Verify lobby remains intact and site is untouched.

## Known open items
- Full playable poker interaction is not finished.
- Dealer/card gameplay still needs full lock.
- Watch hologram still needs final activation-only polish.
- Private-room interiors need deeper visual polish after locomotion is stable.
- Site admin/profile/store pages still need final live API connection once backend endpoints are available.

## Latest Update 1.5 note
- Update 1.5 supersedes the Phase 84 label for current work.
- Phase 84 should be treated as an accidental/old label unless specifically referenced as an internal patch label.
- The current objective is Update 1.5 Stability Build: sky, Quest controller locomotion, deploy extraction, route stability, and approval-safe storefront polish.
