# Phase 366 — Android Physical Device and Profile Live Camera Lock

## Objective

Finish the owner-authorized Android and avatar presentation path without replacing the certified poker, table, controller, profile showroom, or VR dressing-room authorities.

## Android physical-device layer

Phase 366 loads after Phase 365 and adds no visible controller, table, cards, avatars, or poker state.

It provides:

- `visualViewport` sizing for Android browser and APK WebView.
- Safe-area placement for bankroll, hole cards, action buttons, turn panel, and branding.
- Debounced orientation handling.
- A minimum 900 ms interval between seated stabilization corrections.
- One Phase 365 seat stabilization request after a material viewport or orientation change.
- Touch counters for the existing MOVE, LOOK, and action controls.
- Runtime proof that one controller root, one MOVE stick, and one LOOK stick remain.
- Runtime proof that LOBBY and CENTER navigation remain hidden while seated.

Phase 365 remains authoritative for:

- the visible table reference line meeting floor Y=0
- table/card/logo rebuild
- left/right movement direction
- seated gyro and touch look
- bounce damping
- transparent frameless pot
- opponent seat alignment and name tags
- tournament branding slot

## Profile live avatar camera

Phase 366 wraps the existing Phase 351 3D showroom. It does not create another avatar record or viewer.

The profile route now provides:

- Full Body camera presentation
- Portrait camera presentation
- Outfit camera presentation
- Live Orbit presentation
- visible LIVE AVATAR CAM status
- automatic one-time recovery when 3D loading stalls
- permanent visible fallback when WebGL, Three.js, FBX, GLB, or network loading fails
- direct Website Dressing Room link
- direct VR Dressing Room link

The same saved fields remain authoritative:

- `avatarUrl`
- `equippedOutfit.modelId`
- `palette`
- `headwear`
- `eyewear`
- `top`
- `shoes`
- `accessory`

## Routes

- Android: `/game/android.html?channel=stable&v=phase366`
- Profile live camera: `/site/profile.html?v=phase366`
- Website dressing room: `/site/avatar.html?v=phase366`
- VR dressing room: `/game/avatar-vr.html?v=phase353`

## Runtime QA

```js
window.SVR_PHASE366_DEVICE_QA()
window.SVR_PHASE366_DEVICE_CALIBRATE()
window.SVR_PHASE366_DEVICE_STABILIZE()
window.SVR_PHASE366_DEVICE_STATE

await window.SVR_PHASE366_PROFILE_CAMERA_QA()
window.SVR_PHASE366_PROFILE_CAMERA_SET('full')
window.SVR_PHASE366_PROFILE_CAMERA_SET('portrait')
window.SVR_PHASE366_PROFILE_CAMERA_SET('outfit')
window.SVR_PHASE366_PROFILE_CAMERA_SET('orbit')
window.SVR_PHASE366_PROFILE_CAMERA_RETRY()
window.SVR_PHASE366_PROFILE_CAMERA_STATE
```

## Protected product truth

- Certified mode remains local play-money Texas Hold'em against five bots.
- Phase 336 remains poker rules, cards, pots, hand evaluation, and payout authority.
- Phase 347 remains the only Android controller authority.
- Phase 350 remains controller DOM deduplication authority.
- Phase 351 remains profile showroom authority.
- Phase 353 remains VR dressing-room and moving-pedestal authority.
- Phase 365 remains table/seated UX authority.
- No server-authoritative multiplayer or real-money gambling is claimed.

## APK policy

- APK version: `0.1.0-rc1`
- Version code: `1`
- `releaseReady: false`
- `forceUpdate: false`
- `showUpdatePrompt: false`
- `manualUpdateOnly: true`

Phase 366 is a remotely loaded web-runtime update and does not require an APK reinstall.
