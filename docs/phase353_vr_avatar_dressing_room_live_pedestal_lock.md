# Phase 353 — VR Avatar Dressing Room, Moving Pedestal, and Profile Live-Cam Lock

## Build
`PHASE-353-VR-AVATAR-DRESSING-ROOM-LIVE-PEDESTAL-LOCK`

## Connected avatar system
The website dressing room, Phase 351 profile showroom, WebXR dressing room, Android/Quest/PC avatar bridge, and future Unity avatar provider all use the same profile fields:

- `avatarUrl`
- `equippedOutfit.modelId`
- palette
- headwear
- eyewear
- top
- shoes
- accessory

No profile-only or VR-only avatar record is created.

## Starter avatar looks
1. Table Ready — Eric body, Midnight palette
2. Scorpion VIP — Claudia body, Scorpion palette
3. Founder — Eric body, Gold Room palette
4. Social Lounge — Claudia body, Royal palette

The four looks use the two verified FBX player bodies and existing wardrobe presets. Meta avatars remain a later native Unity/Quest provider.

## VR dressing room
Route: `/game/avatar-vr.html?v=phase353`

Features:
- WebXR entry through Three.js `VRButton`
- desktop orbit and zoom controls
- two XR controller rays
- four selectable in-room preset panels
- fallback avatar if FBX/GLB loading fails
- account/demo profile saving
- direct links to website dressing room and profile live cam

## Moving pedestal
- rotating pedestal root
- slow vertical hover motion
- counter-rotating cyan scan ring
- gold outer ring
- subtle avatar idle rotation
- pause/resume control
- reset view control

## Profile live cam
Phase 351 remains the profile live-camera authority. Its existing Avatar Route button now opens the WebXR dressing room through `/game/avatar.html`, which redirects to `/game/avatar-vr.html?v=phase353`.

## Runtime QA
```js
window.SVR_PHASE353_QA()
window.SVR_PHASE353_APPLY_PRESET(0)
window.SVR_PHASE353_SAVE()
window.SVR_PHASE353_TOGGLE_PEDESTAL()
window.SVR_PHASE353_STATE
```

## Protected locks
- Phase 345 account/demo contract
- Phase 346 catalog and body assets
- Phase 351 profile showroom
- Phase 350 site integrity authority
- Phase 336 poker authority
- Android controller authority
- APK `0.1.0-rc1`, code `1`, manual-update only
