# Phase 366 Auto Deploy Marker

## Build
`PHASE-366-ANDROID-DEVICE-CALIBRATION-AVATAR-LIVE-CAMERA-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Phase 366 validation workflow: `.github/workflows/phase366-device-calibration-avatar-camera.yml`
- Complete Android Hold'em regression: Phase 363 browser acceptance
- Phase 365 seated UX/branding regression remains required

## Static runtime payload
- `game/android.html`
- `game/android-release.json`
- `game/manifest.json`
- `game/modules/phase340_platform_manifest.js`
- `game/modules/phase366_android_device_calibration_avatar_showroom_continuity_lock.js`
- `site/profile.html`
- `site/js/phase366-profile-live-camera-continuity.js`
- `game/avatar-vr.html`
- Phase 366 tests and handoff records

## Android device-calibration locks
- Phase 365 remains the default/reset baseline.
- Calibration is available only from one small lobby button.
- The calibration button and panel are hidden after JOIN TABLE.
- Settings are stored only on the current device under `svr.phase366.androidCalibration.v1`.
- Calibration can adjust table height, seat distance/height, HUD scale, pot opacity/size, gyro sensitivity, and opponent seat offsets.
- Calibration does not edit cards, poker state, bankroll, profile identity, or backend records.
- Reset restores all Phase 365 defaults.
- Phase 347 remains the only Android MOVE, LOOK and poker-action controller.

## Avatar live-camera continuity
- Phase 351 remains the profile 3D showroom renderer and visible fallback authority.
- Phase 346 remains the website wardrobe authority.
- Phase 353 remains the VR dressing room and moving-pedestal authority.
- Phase 366 synchronizes the same saved profile record across all three routes.
- The profile camera refreshes after profile/account changes, avatar saves, storage changes, and page visibility restoration.
- No duplicate avatar record, scene, camera, or pedestal authority is introduced.

## Runtime QA
```js
window.SVR_PHASE366_QA()
window.SVR_PHASE366_OPEN_CALIBRATION()
window.SVR_PHASE366_SET_CALIBRATION({ seatDistanceOffset: -0.04, hudScale: 0.92 })
window.SVR_PHASE366_RESET()
window.SVR_PHASE366_PROFILE_CAMERA_QA()
window.SVR_PHASE366_PROFILE_CAMERA_REFRESH()
```

## Validation status
- Phase 345 Account API Check: protected
- Phase 346 Avatar Check: protected
- Phase 347 Android Check: protected
- Phase 351 Profile Showroom Check: protected
- Phase 353 VR Avatar Check: protected
- Phase 363 Android complete Hold'em: required
- Phase 364 Device XR Geometry Check: protected
- Phase 365 Android Seated UX Branding Check: required
- Phase 366 Device Calibration Avatar Camera Check: pending PR validation
- Physical owner-device calibration/comfort acceptance: pending

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
- Phase 366 updates the remote stable web runtime used by the installed RC1 wrapper; it does not claim a newly signed APK.
