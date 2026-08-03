# Phase 367 — Android Physical-Device Viewport + Touch Acceptance Lock

## Build

`PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK`

## Android route

`/game/android.html?channel=stable&v=phase367`

## Purpose

Phase 367 calibrates the certified Phase 365 Android game to the actual browser or APK WebView dimensions without creating a second controller, table, card system, avatar system, camera, or poker authority.

## Physical-device layer

- Uses `visualViewport` width, height, scale, and offsets.
- Applies Android safe-area placement to the seated bankroll, hole cards, turn panel, brand slot, and action buttons.
- Debounces orientation and viewport changes.
- Enforces at least 900 ms between seated stabilization corrections.
- Reuses `SVR_PHASE365_STABILIZE_SEAT()` rather than introducing another seat authority.
- Records real pointer input on the existing MOVE, LOOK, and poker-action controls.
- Audits one `#svr347Root`, one `#svr347Move`, one `#svr347Look`, and one `#svr347Actions` panel.
- Verifies LOBBY, CENTER, and CENTER VIEW remain hidden while seated.

## Protected avatar routes

The merged Phase 366 profile reliability system remains unchanged:

- Profile live camera: `/site/profile.html?v=phase366`
- Website dressing room: `/site/avatar.html?v=phase366`
- VR dressing room and moving pedestal: `/game/avatar-vr.html?v=phase366`

They continue to use one shared avatar/profile record.

## Protected gameplay authorities

- Phase 336 — poker rules and settlement
- Phase 347 — single Android controller
- Phase 350 — controller DOM deduplication
- Phase 351 — profile 3D showroom
- Phase 353 — VR dressing room and pedestal
- Phase 354 — full local-game acceptance
- Phase 357 — table/status/showdown presentation
- Phase 363 — JOIN/LEAVE, bankroll, raise, streets, and audio
- Phase 364 — table and device geometry
- Phase 365 — seated HUD, table reference line, pot, avatars, branding, gyro, and camera damping
- Phase 366 — profile live-camera and dressing-room reliability

## Runtime QA

```js
window.SVR_PHASE367_DEVICE_QA()
window.SVR_PHASE367_DEVICE_CALIBRATE()
window.SVR_PHASE367_DEVICE_STABILIZE()
window.SVR_PHASE367_DEVICE_STATE
```

## Acceptance gate

The Android-sized browser test must prove:

1. Landscape lobby uses the current visual viewport.
2. MOVE, LOOK, and one action receive real pointer input.
3. Portrait rotation updates the stage dimensions.
4. Returning to landscape restores the correct stage.
5. JOIN TABLE hides MOVE, LOOK, LOBBY, and CENTER.
6. A rapid resize/stabilization burst does not repeatedly recenter the camera.
7. Exactly one controller and one action panel remain.
8. LEAVE TABLE restores lobby controls.
9. Phase 365 remains green.
10. Phase 366 profile and dressing-room checks remain green.
11. Complete Hold’em still settles and conserves 90,000 chips.
12. No browser, console, asset, or local-request failures occur.

## Product truth

- Current certified mode remains local play-money Texas Hold’em against five bots.
- Server-authoritative multiplayer is not claimed.
- Physical touch comfort and exact safe-area placement still require the owner’s phone after deployment.
- No real-money gambling is implemented.

## APK lock

- APK version: `0.1.0-rc1`
- Version code: `1`
- `releaseReady: false`
- `forceUpdate: false`
- `showUpdatePrompt: false`
- `manualUpdateOnly: true`

Phase 367 is a remote web-runtime update and does not require an APK reinstall.
