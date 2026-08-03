# Phase 366 — Profile Live Camera and Dressing Room Reliability Lock

## Owner goal

- Keep the Phase 365 Android gameplay/table alignment release intact.
- Make the profile page show a live avatar camera instead of remaining on an endless loading state.
- Preserve the full 3D website showroom and WebXR dressing room.
- Use the same saved avatar and outfit record across profile, dressing room, Android, Quest, and PC.

## Root cause

The Phase 345 account client used an unbounded configuration fetch. On an Android WebView or unstable mobile connection, that request could remain pending and leave both the profile identity and the Phase 351 showroom waiting forever.

## Corrections

- Adds a 4.5-second bounded account-bootstrap recovery layer.
- Restores the saved local demo profile when the production API is unavailable or slow.
- Guarantees the profile camera resolves to one of three states:
  - live 3D avatar camera ready
  - explicit fallback avatar camera ready
  - profile/login required
- Adds a visible live-camera badge and VR dressing-room bridge.
- Retries the existing Phase 351 viewer after account, visibility, page-show, and outfit changes.
- Updates profile and VR dressing-room cache keys to Phase 366.
- Preserves Phase 353 WebXR, moving pedestal, starter presets, controller rays, profile saving, and procedural avatar fallback.

## Protected systems

- Phase 336 poker rules and settlement
- Phase 347 single Android controller
- Phase 351 3D profile showroom
- Phase 353 WebXR dressing room and moving pedestal
- Phase 365 Android seated UX, table line, gyro, avatars, pot, and branding
- APK `0.1.0-rc1`, code `1`, manual-update-only

## Test routes

- Profile live camera: `https://svrpoker.com/site/profile.html?v=phase366`
- Website dressing room: `https://svrpoker.com/site/avatar.html?v=phase366`
- VR dressing room: `https://svrpoker.com/game/avatar-vr.html?v=phase366`
- Android gameplay: `https://svrpoker.com/game/android.html?channel=stable&v=phase365`

## Runtime QA

```js
window.SVR_PHASE366_ACCOUNT_QA()
window.SVR_PHASE366_PROFILE_LIVE_CAMERA_QA()
await window.SVR_PHASE366_PROFILE_LIVE_CAMERA_RETRY()
window.SVR_PHASE366_OPEN_VR_DRESSING_ROOM()
window.SVR_PHASE351_PROFILE_SHOWROOM_QA()
window.SVR_PHASE353_QA()
```

## Product truth

Production account/database mode still requires the secure backend deployment. Local demo mode remains clearly labeled. This phase does not change the Android APK version or claim server-authoritative multiplayer.
