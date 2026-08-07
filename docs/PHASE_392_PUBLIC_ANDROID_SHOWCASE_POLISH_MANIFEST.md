# Phase 392 — Public Page, Android Gameplay, Camera 3, Avatar, and Site Polish

## Release lock

`PHASE-392-PUBLIC-ANDROID-SHOWCASE-POLISH-LOCK`

## Public page

- Restores the public launch page to exactly three primary actions:
  1. Preview Site
  2. Platform Game
  3. Contact
- The Platform Game button detects Android, Meta Quest, or desktop.
- Android opens the touch game and explicitly states that it is not the VR version.
- Quest opens Enter VR.
- Desktop opens the table-focused Camera 3 showcase.

## Android gameplay

Build: `PHASE-392-ANDROID-CONTINUOUS-PLAY-RANKING-LOCK`

- Adds Leave Table.
- Continues automatically while the player has play chips.
- Stops and displays an Out of Play Chips overlay at zero.
- Adds a play-chip restart option.
- Adds player profile icons and rank labels.
- Adds persistent XP and rank progression.
- Enlarges player panels and separates cards from stack/rank text.
- Uses the bright SVR logo in the table center.
- Centers the pot over the logo.
- Animates chips into the pot and from the pot to the winner.
- Uses the SVR logo on deck, burn, and facedown cards.
- Implements burn/flop, burn/turn, burn/river sequencing.
- Adds winner banner, confetti, highlight, and XP award.
- Adds two sponsor/ad zones driven by `window.SVR_ANDROID_SPONSORS`.
- Splits the Android presentation into a validated HTML shell, Phase 392 gameplay module, and responsive Phase 392 stylesheet.
- Preserves the manual-only APK RC2 policy.

## Camera 3

Build: `PHASE-392-CAMERA3-TABLE-SHOWCASE-LOCK`

New route:

`/game/camera3-showcase.html?v=phase392`

- Focuses closely on the original poker table.
- Uses three table advertising shots rather than wide empty-background shots.
- Requires the original table, recessed surface, at least 17 card meshes, upright Eric, and showcase lighting.
- Legacy Camera 3 aliases redirect to the new showcase.

## Avatar room

Build: `PHASE-392-AVATAR-PEDESTAL-UPRIGHT-LOCK`

- Removes the Matrix-rain intro from the avatar page.
- Keeps the header visible at the top.
- Shows the avatar stage immediately.
- Adds anatomical bone-based upright correction and grounding for Eric.

## Full website

Build: `PHASE-392-SITE-PRESENTATION-POLISH-LOCK`

- Consolidates the header to one stable menu.
- Removes the predecessor floating-menu and VIBEZ-injection authority from `market-ads.js`.
- Adds a large first slide with the Scarlett/SVR logo.
- Adds Play Android, Virtual Reality Ready, and Download APK presentation.
- Enlarges and properly fits slide images.
- Removes carousel arrow/dot clutter.
- Adds swipe navigation and automatic restart.
- Removes VIBEZ from the homepage hero/cards while preserving `/site/vibez.html` in the menu.
- Adds floating Ask SVR AI, Play Android, and Download APK controls.
- Adds APK version/update badges based on `android-release.json`.
- Routes the live preview to Camera 3 Showcase.

## Reiki audit

The repository contains a debranded Reiki hub module directory and these website routes:

- `/site/REIKI.html`
- `/site/reiki-about.html`
- `/site/store-reiki.html`
- `/game/modules/hubs/reiki_hub/`

The direct Quest poker route intentionally skips lobby hubs for performance, so the Reiki room is not part of the direct-table gameplay route. No previously terminated partner branding is reintroduced.

## Protected release policy

- APK version name: `0.1.0-rc2`
- APK version code: `2`
- Forced update: disabled
- Update prompt: disabled
- Native APK rebuild: not claimed

## Physical acceptance

- Android: verify portrait/landscape layout, continuous hands, leave, out-of-chips handling, burn cards, pot animation, and sponsor zones.
- Quest: verify the existing Phase 391 table runtime on-device.
- Avatar: verify Eric is vertical on the pedestal.
- Camera 3: verify the table remains centered and prominent.