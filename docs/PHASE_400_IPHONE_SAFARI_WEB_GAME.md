# Phase 400 — iPhone / Safari Web Game

Build: `PHASE-400-IPHONE-SAFARI-WEB-GAME-LOCK`

## Goal
Make the existing SVR Poker touch game available on iPhone, iPad, and Safari without replacing or disturbing the approved Android gameplay or protected Quest build.

## New public routes
- `/game/iphone.html?v=phase400`
- `/game/iphone-tabletop.html?v=phase400`
- `/game/android-stable.html?v=phase400&platform=ios&safari=1&direct=1`

The public launch page now detects iPhone/iPad/iPod plus iPadOS desktop-mode Safari and routes those devices to the iPhone entry.

## Safari / iOS compatibility
- `viewport-fit=cover`
- Apple web-app capable metadata
- Apple touch icon
- notch / Dynamic Island safe-area padding through `env(safe-area-inset-*)`
- `100dvh` / dynamic viewport handling
- `visualViewport` resize tracking
- 44px minimum primary touch targets
- `touch-action: manipulation`
- tap-highlight and accidental text-selection suppression
- Safari audio unlock on first user gesture
- existing `webkitAudioContext` fallback preserved
- microphone capability check through `navigator.mediaDevices.getUserMedia`
- iPhone microphone instructions for the Phase 399 push-to-talk control
- Add to Home Screen / standalone PWA readiness

## Protected gameplay
Phase 400 does **not** rewrite poker rules.

Protected Android authorities remain:
- Phase 399 learning / chip / sponsor layer
- Phase 398 exact Call / Raise-To math
- Phase 397 clockwise action order
- Phase 396 board / burn / dealer presentation

Protected Quest authority remains Phase 396.

The Android RC2 APK remains `0.1.0-rc2`, version code `2`, manual-only, with no forced update or rebuild.

## Multiplayer / voice status
The iPhone route can load the existing Phase 399 matchmaking and WebRTC voice-ready client. Microphone permission is Safari-compatible and must still be initiated by a user gesture.

A production matchmaking/signaling endpoint is still not configured, so internet multiplayer and live peer voice remain **not live**. Bot fallback remains the correct behavior until the secure `wss://` backend exists.

## QA globals
- `window.SVR_PHASE400_IOS_SAFARI_QA()`
- `window.SVR_PHASE400_IPHONE_WRAPPER_QA()`

## Physical acceptance still required
CI can verify source contracts, syntax, routing, and deployment payloads. It cannot claim a physical iPhone/Safari acceptance test. On-device acceptance should confirm:
1. public page shows **Play on iPhone**,
2. table fills Safari correctly in portrait and landscape,
3. notch/home-indicator areas do not cover controls,
4. JOIN, CHECK/CALL, RAISE TO, FOLD, ALL IN and slider respond to touch,
5. sounds start after the first user gesture,
6. MIC permission prompt appears only after tapping MIC,
7. Hand Coach, HANDS guide, chip rack, tournament ticket notice, and Reiki branding remain visible,
8. Android and Quest behavior remain unchanged on their respective devices.
