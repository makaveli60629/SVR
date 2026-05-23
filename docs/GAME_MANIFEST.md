# SVR Poker Game Manifest

## Purpose
This folder preserves working state, priorities, and handoff notes so progress is not lost between phases.

## Current locked phase
**PHASE-103-STABILITY-AUDIT-LOCK**

Phase 103 is a stability/audit lock. It does not add heavy visual loops. It verifies and records that the current modular boot path is aligned around game/site/data interaction, private-room portals, AWS-ready public API fallback data, and stable locomotion.

## Current package baseline
Current repo baseline:
- `main` branch
- Game boot path: `game/index.html`
- Loaded bridge: `game/modules/sponsor_billboard_bridge.js`
- Stability verifier: `game/modules/phase103_stability_audit.js`

## Locked baselines
- Official forearm watch baseline is the reference watch.
- Watch screen should face the user/upward and stay readable.
- Watch hologram should remain off until activated or triggered by watch/teleport state.
- Correct spelling is **Reiki**.
- Reiki public/sponsor branding remains approval-safe unless explicitly approved.
- Use **AWS-ready secure API architecture** for data; do not expose backend/database/payment/admin secrets in browser code.
- Game modules must remain removable/swappable.
- Private rooms must remain separate scenes/routes, not full rooms embedded inside the lobby.
- Quest/Android/desktop locomotion must remain a locked module, not scattered across unrelated files.

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
- Corrected Espresso With Cream ad asset path
- AWS-ready public data fallback bridge
- Camera-forward locomotion module
- Teleport release commit guard
- Purple hand fire teleport-state indicator
- Green Reiki approval-safe hub polish module
- High Moon and Mars smart polish module

## Locomotion lock
- Left stick / Android movement stick = camera-forward movement.
- Right stick = 45-degree snap turn only.
- Controller trigger/A-style hold = aim teleport.
- Release = commit teleport once, then teleport turns off.
- Hand tracking: fist enables teleport; aim; pinch/clench release commits movement; teleport turns off.
- Purple hand fire shows only when teleport is ON.
- Heavy scene scans must not run every frame in the stable boot path.

## Private room routes
- `game/scorpion.html`
- `game/reiki.html`
- `game/pga-drive.html`
- `game/chip-putt.html`
- `game/store-room.html`
- `game/smoker-lounge.html`

## Site/game/data target
- Site stays professional and populated with public-facing copy.
- Game uses bridge/fallback data for profile, rooms, ads, store products, manifest, and game events.
- Secure API default remains `https://api.svrpoker.com`.
- Public pages should not mention internal database/cloud work in user-facing copy.
- Browser code must never include private database credentials, Stripe/payment secrets, or admin secrets.

## Current priority order
1. Verify teleport release does not freeze.
2. Verify Quest/Android controller movement.
3. Verify watch alignment and hologram activation behavior.
4. Verify private-room portal routing.
5. Verify Scorpion room one-table poker presentation.
6. Verify Reiki green approval-safe area with red carpet, red ropes, and plants.
7. Continue poker gameplay lock: dealing, readable cards, timer, pot, winner banner.

## Known open items
- Full playable poker interaction is not finished.
- Dealer/card gameplay still needs full lock.
- Watch hologram still needs final activation-only polish.
- Android virtual-stick UI may need a visible on-screen fallback if browser Gamepad axes are absent.
- Private-room interiors need deeper visual polish after locomotion is stable.
- Site admin/profile/store pages still need final live API connection once AWS backend endpoints are available.

## Asset notes
- Store build currently expects `store.glb` / `store.fbx` when available.
- Plant assets should remain staged around Reiki, with procedural fallback if assets are missing.
- Espresso ad uses the corrected uploaded cup image through `game/assets/ads/espresso_lobby_wall_ad_phase91.svg` and the current cache-busted patch.

## Latest Phase 103 note
- Added `game/modules/phase103_stability_audit.js`.
- Chained Phase 103 through `game/modules/sponsor_billboard_bridge.js`.
- Runtime status object: `window.SVR_PHASE103_STABILITY`.
- This phase is a hard audit lock before adding more visuals or gameplay features.
