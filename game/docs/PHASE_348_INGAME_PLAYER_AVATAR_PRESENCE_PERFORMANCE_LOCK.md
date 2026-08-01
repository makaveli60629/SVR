# Phase 348 — In-Game Player Avatar Presence and Performance Lock

## Build

`PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK`

## Objective

Use the Phase 346 selected player profile avatar inside the playable game without creating a second account, seat, camera, or avatar authority.

## Runtime authority

- Profile source: `window.SVR_PLAYER_AVATAR_PROFILE`
- Profile bridge: `modules/phase346_player_avatar_profile_bridge.js`
- In-game runtime: `modules/phase348_ingame_player_avatar_presence_performance_lock.js`
- Table coordinate source: `window.SVR_PHASE341_TABLE_LAYOUT`
- Player seat: canonical seat `0`, south/front
- Root name: `PHASE348_LOCAL_PLAYER_AVATAR_ROOT`
- Exactly one local player avatar root is allowed.

## Supported player bodies

- Eric: `/game/assets/models/eric/eric.fbx`
- Claudia: `/game/assets/models/claudia/claudia.fbx`
- Future FBX bodies
- Future GLB/glTF bodies
- Lightweight procedural fallback mannequin

The poker-table Eric and Claudia NPCs remain separate objects and are not replaced by the profile avatar.

## Standing behavior

- Avatar feet follow the local player camera/rig position.
- Avatar yaw follows player look direction.
- The body is positioned slightly behind the camera center to reduce clipping.
- Materials use front-facing rendering so the camera does not render the interior of the avatar head.
- Idle breathing is procedural and low-cost.

## Seated behavior

- The body snaps to Phase 341 seat `0`.
- The body faces the table center.
- The body does not slide away from the seat while the Android player uses the Phase 347 seated left/right view rail.
- Available head/neck bones follow the player's look direction within safe yaw and pitch limits.
- If the model does not contain separate head/neck bones, the body remains stable without failing.

## Outfit behavior

The runtime reads the Phase 346 schema-versioned outfit record:

- `modelId`
- `palette`
- `headwear`
- `eyewear`
- `top`
- `shoes`
- `accessory`

Lightweight procedural equipment is capped by platform. The base body remains the selected Eric or Claudia model.

## Platform budgets

| Platform | Pose updates | Animation updates | Equipment meshes |
|---|---:|---:|---:|
| Android | 24 Hz | 18 Hz | 6 |
| Quest | 30 Hz | 24 Hz | 5 |
| PC/Desktop | 60 Hz | 30 Hz | 8 |

Additional locks:

- Shadows disabled on the local profile avatar.
- Frustum culling enabled.
- Duplicate Phase 348 roots are removed.
- Only one body load remains active after a profile change.
- Camera 3 receives no account bridge, profile bridge, or in-game avatar runtime.

## Protected systems

Phase 348 does not replace:

- Phase 336 poker rules and settlement authority
- Phase 341 table geometry and seat coordinates
- Phase 342 adaptive performance authority
- Phase 344 single-fire/full-hand Android authority
- Phase 345 account/activity/reward authority
- Phase 346 avatar creator and profile schema
- Phase 347 Android controls, cards, logo, pot display, or seated movement
- Camera 3 spectator route

## Runtime QA

```js
window.SVR_PHASE348_QA()
window.SVR_PHASE348_STATE
window.SVR_PHASE348_BUDGET
window.SVR_PHASE348_GET_ROOT()
window.SVR_PHASE348_RECENTER()
await window.SVR_PHASE348_RELOAD()
```

Expected QA conditions:

- `roots === 1`
- `singleRoot === true`
- `bodyLoaded === true`
- `avatarProfileBridge === true`
- `tableLayout === true`
- `seatAligned === true` while seated
- `withinMeshBudget === true`
- `withinEquipmentBudget === true`

## Test routes

Android:

`https://svrpoker.com/game/android.html?channel=stable&v=phase348`

Quest and PC:

`https://svrpoker.com/game/index.html?v=phase348`

Avatar creator:

`https://svrpoker.com/site/avatar.html?v=phase346`

## Acceptance sequence

1. Open the avatar creator and save Eric or Claudia with an outfit.
2. Open the game route.
3. Confirm one player body loads.
4. Confirm the selected model and outfit match the profile.
5. Walk and turn; verify the body follows the local rig.
6. Sit at the table; verify the body remains at the south/front seat.
7. Look left and right; verify safe head/neck reaction where supported.
8. Leave the seat; verify standing follow resumes.
9. Change the avatar profile and call `SVR_PHASE348_RELOAD()`.
10. Confirm there is still exactly one local player root.

## APK policy

Phase 348 is a web-runtime phase.

- Current APK: `0.1.0-rc1`, code `1`
- Reserved next APK: `0.1.0-rc2`, code `2`
- `releaseReady`: false
- APK URL: empty
- Forced update: false
- Automatic prompt: false
- Manual update only: true

A native RC2 remains blocked until the original wrapper source and signing identity are restored and a signed package passes upgrade acceptance.
