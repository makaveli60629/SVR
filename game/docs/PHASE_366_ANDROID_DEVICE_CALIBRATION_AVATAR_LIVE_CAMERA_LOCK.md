# Phase 366 — Android Device Calibration + Avatar Live Camera

## Build

`PHASE-366-ANDROID-DEVICE-CALIBRATION-AVATAR-LIVE-CAMERA-LOCK`

## Android route

`/game/android.html?channel=stable&v=phase366`

## Profile and dressing-room routes

- `/site/profile.html?v=phase366`
- `/site/avatar.html?v=phase366`
- `/game/avatar-vr.html?v=phase366`

## Device-local calibration

The lobby-only calibration drawer adjusts table height, seated distance/height, HUD scale, pot opacity/size, gyro sensitivity, and opponent seat offsets. Settings use local storage and never modify poker state, bankroll, profile identity, or backend data.

Reset authority: `PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK`.

## Avatar continuity

The Phase 351 profile showroom remains the live-camera renderer. The Phase 346 website dressing room and Phase 353 VR dressing room remain the editing/pedestal authorities. Phase 366 refreshes the live camera from their shared profile record.

## Protected gameplay

- Phase 336 poker rules and settlement
- Phase 347 single Android controller
- Phase 363 JOIN/LEAVE and 15,000-chip six-seat table
- Phase 364 table/device geometry
- Phase 365 seated UX, transparent pot, avatar/name alignment and branding

## APK lock

- `0.1.0-rc1`
- code `1`
- no forced update
- no automatic prompt
- manual update only
- no signed RC2 claim

## QA

```js
window.SVR_PHASE366_QA()
window.SVR_PHASE366_OPEN_CALIBRATION()
window.SVR_PHASE366_SET_CALIBRATION({ hudScale: 0.92, potOpacity: 0.7 })
window.SVR_PHASE366_RESET()
window.SVR_PHASE366_PROFILE_CAMERA_QA()
window.SVR_PHASE366_PROFILE_CAMERA_REFRESH()
```
