# Phase 95 — Site Store Android Boot Lock

## Scope

This phase organizes the website store flow, improves banner behavior, adds Android/mobile layout guards, and adds a safer game boot recovery overlay.

## Site updates

- Store sample catalog expanded in `site/data/store-samples.json`.
- Store page now renders the sample catalog from JSON through `site/js/store-samples.js`.
- Store page includes four banner lanes:
  - SVR Gear
  - PGA Training
  - Reiki Room approval-safe placeholders
  - Android Ready
- Banner carousel logic in `site/js/market-ads.js` now supports:
  - autoplay
  - previous/next buttons
  - dot controls
  - touch swipe
  - lazy image loading
  - image-failure fallback cards
  - Android/coarse-pointer floating navigation
- Android/mobile readiness CSS added in `site/site-android-readiness.css`.

## Game boot updates

- `game/index.html` now includes a boot guard overlay.
- The boot guard shows module-loading stages instead of silently staying on Booting.
- If boot takes too long or a runtime error occurs, the guard shows:
  - Reload Game
  - Open Site
  - Preview Mode
- `game/main.js` now reports boot stages and calls `window.svrBootReady()` when the game is ready.

## Protected areas

- Public Matrix launch page intent preserved.
- `/game` lobby/private scene structure preserved.
- No unapproved Reiki sponsor/founder branding added.
- No live checkout enabled.
- No API keys, SQL strings, Stripe secrets, or passwords added.

## Test checklist

1. Open `/site/index.html` and verify banners autoplay and dots work.
2. Open `/site/store.html` and verify sample items load.
3. Test on Android width or mobile emulator; floating Menu should appear.
4. Open `/game/index.html?v=phase95-site-store-android-boot-lock`.
5. Confirm boot overlay clears after game loads.
6. If the game fails to load, confirm recovery actions appear instead of a blank/stuck screen.
