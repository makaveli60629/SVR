# Phase 367 Auto Deploy Marker

## Build
`PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Phase 367 validation workflow: `.github/workflows/phase367-android-physical-device.yml`
- Complete Android Hold’em regression: Phase 363 browser acceptance
- Phase 365 seated UX/branding regression remains required
- Phase 366 profile live-camera regression remains required

## Static runtime payload
- `game/android.html`
- `game/android-release.json`
- `game/manifest.json`
- `game/modules/phase340_platform_manifest.js`
- `game/modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js`
- Phase 367 tests and handoff records

## Android physical-device locks
- Phase 347 remains the only Android MOVE, LOOK, and poker-action controller.
- Phase 365 remains the table, seated HUD, transparent pot, avatar-seat, branding, gyro, and damping authority.
- Phase 367 creates no second controller, table, cards, avatars, camera, or poker authority.
- The Android stage uses `visualViewport` dimensions and offsets.
- Safe-area placement protects bankroll, hole cards, turn status, brand slot, and action controls.
- Resize and orientation changes are debounced.
- Seated stabilization is rate-limited to a minimum 900 ms interval.
- MOVE, LOOK, and action pointer events are counted for physical-device acceptance.
- Exactly one controller root, MOVE stick, LOOK stick, and action panel are required.
- LOBBY, CENTER, and CENTER VIEW must remain hidden while seated.

## Protected profile and avatar locks
- Phase 366 remains the profile live-camera and dressing-room reliability authority.
- Profile route: `/site/profile.html?v=phase366`
- Website dressing room: `/site/avatar.html?v=phase366`
- VR dressing room and moving pedestal: `/game/avatar-vr.html?v=phase366`
- All avatar routes continue to use the same profile and equipped-outfit record.
- Phase 367 does not edit profile or dressing-room source files.

## Runtime QA
```js
window.SVR_PHASE367_DEVICE_QA()
window.SVR_PHASE367_DEVICE_CALIBRATE()
window.SVR_PHASE367_DEVICE_STABILIZE()
window.SVR_PHASE367_DEVICE_STATE
```

## Validation status
- Phase 345 Account API Check: protected
- Phase 346 Avatar Check: protected
- Phase 347 Android Check: protected
- Phase 349 Presence Check: protected
- Phase 350 Site Integrity Check: protected
- Phase 351 Profile Showroom Check: protected
- Phase 353 VR Avatar Check: protected
- Phase 354 Android Full Game Acceptance: protected
- Phase 363 Android complete Hold’em: required
- Phase 364 Device XR Geometry Check: protected
- Phase 365 Android Seated UX Branding Check: required
- Phase 366 Profile Live Camera Check: required
- Phase 367 Android Physical Device Check: pending PR validation
- Physical owner-device Android acceptance: pending

## APK release gate
- Current APK: `0.1.0-rc1`, code `1`
- Reserved next APK: `0.1.0-rc2`, code `2`
- Signed native package present: false
- Native wrapper source/signing identity present: false
- `releaseReady`: false
- APK URL: empty
- Forced update: false
- Automatic update prompt: false
- Manual update only: true
- Phase 367 updates the remote stable web runtime used by the installed RC1 wrapper; it does not claim a newly signed APK.
