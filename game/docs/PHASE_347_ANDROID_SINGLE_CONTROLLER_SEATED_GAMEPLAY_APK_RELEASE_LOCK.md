# Phase 347 — Android Single Controller, Seated Gameplay, and APK Release Lock

## Build
`PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK`

## Root causes confirmed

1. The Phase 326 movement loop used `strafe = -left.dx`, reversing left and right movement.
2. The legacy Phase 326 controller remained active beneath the Phase 343 HUD, allowing two visual control layers to reappear.
3. The old SIT path used a fixed 2.55-meter table setback and maintained separate local seat state.
4. Hole/community card presentation depended on older HUD and table layers that could be hidden or positioned outside the Android view.
5. The update checker consumed stale deploy metadata and had no verified native release source.
6. No native Android wrapper project, signing identity, or installable APK is present on current `main`.

## Single Android controller

Phase 347 loads last on Android and is the only visible control authority.

- One MOVE stick
- One LOOK stick
- One six-button poker action rail
- One SIT/LEAVE button
- One collapsible raise control
- All Phase 326/343/344 visual controllers are hidden and inert
- Phase 344 remains the underlying single-fire poker action broker

## Correct movement

Lobby mode:

```js
const forwardAmount = -moveStick.y;
const rightAmount = moveStick.x;
```

Seated mode:

```js
seatX += moveStick.x * speed * deltaTime;
```

Dragging left produces a negative X change. Dragging right produces a positive X change.

## Seated table behavior

SIT measures the Phase 341 canonical table and places the player at the south/front position.

While seated:

- Forward/back movement is ignored.
- MOVE slides only left/right along a clamped table rail.
- LOOK rotates within controlled yaw and pitch limits.
- Recenter returns the camera to the table and community-card target.
- The seat pose is reapplied during the first 900 ms to defeat late rig resets.

## Android card presentation

- Two authoritative hole-card HUD slots
- Five authoritative community-card HUD slots
- Seven Android-only camera-anchored floating card planes
- Card values are sourced from the Phase 336 engine
- Phase 341 table-card presentation remains enabled

## Table presentation

- One Android center logo at 22% of playable table width
- Root logo texture with a generated SVR fallback
- One raised translucent pot sprite above table center
- Pot value follows the authoritative poker state

## Poker actions

- DEAL / NEXT HAND / FOLD
- SIT / LEAVE
- CHECK
- CALL with exact amount
- RAISE drawer
- ALL IN
- 700 ms duplicate input suppression before the Phase 344 broker
- Legal actions remain governed by Phase 336

## Runtime QA

```js
window.SVR_PHASE347_QA()
window.SVR_PHASE347_SIT()
window.SVR_PHASE347_LEAVE()
window.SVR_PHASE347_RECENTER()
await window.SVR_PHASE347_RUN_FULL_HAND_QA()
window.SVR_PHASE347_STATE
```

QA checks one visible controller, direct horizontal mapping, seat distance, slide-only mode, 2+5 card slots, seven floating card views, logo, raised pot, six buttons, and screen overlap.

## APK release truth

Current installed release remains:

- Version name: `0.1.0-rc1`
- Version code: `1`

Reserved next slot:

- Version name: `0.1.0-rc2`
- Version code: `2`

The next APK cannot be produced as an update to the existing app until the existing wrapper source and signing identity are restored. Phase 347 therefore sets:

- `releaseReady: false`
- `apkUrl: ""`
- forced update disabled
- automatic prompt disabled
- manual update only

The site creates a small update menu only when all three conditions are true:

1. `releaseReady === true`
2. `apkUrl` is non-empty
3. published version code is newer than the installed code

## Protected locks

- Phase 336 poker authority
- Phase 341 table/card coordinate authority
- Phase 342 performance authority
- Phase 344 single-fire/full-hand authority
- Phase 345 account and reward authority
- Phase 346 avatar/profile authority
- Camera 3 remains free of Android controls and update UI logic
