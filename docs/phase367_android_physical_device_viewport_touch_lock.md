# Phase 367 — Android Physical-Device Viewport and Touch Acceptance Lock

## Objective

Move the certified Android game from simulated mobile dimensions toward the owner’s real Android browser/APK WebView without replacing the poker, table, controller, seated HUD, profile camera, or dressing-room systems.

## Runtime behavior

Phase 367 loads after Phase 365 and creates no new visible control, table, card, avatar, camera, or poker authority.

It adds:

- `visualViewport` width, height, scale, and offset tracking
- safe-area placement for bankroll, hole cards, turn status, brand slot, and action controls
- debounced resize/orientation processing
- a 900 ms minimum interval between seated stabilization corrections
- Phase 365 seat stabilization only after a material viewport/orientation change
- physical pointer counters for the existing MOVE, LOOK, and action controls
- runtime audits for one controller root, one MOVE stick, one LOOK stick, and one action panel
- runtime proof that LOBBY/CENTER navigation remains hidden while seated

## Protected authority stack

- Phase 336 — poker rules, cards, pots, hand evaluation, and payout
- Phase 347 — only Android MOVE, LOOK, and poker-action controller
- Phase 350 — controller DOM deduplication
- Phase 351 — profile 3D showroom renderer
- Phase 353 — WebXR dressing room and moving pedestal
- Phase 354 — complete Android local-game acceptance
- Phase 357 — table/status/showdown presentation
- Phase 363 — JOIN/LEAVE, bankroll, raise, streets, and audio
- Phase 364 — table/device geometry
- Phase 365 — seated HUD, table line, pot, avatars, branding, gyro, and damping
- Phase 366 — profile live-camera and dressing-room reliability

## Routes

- Android: `/game/android.html?channel=stable&v=phase367`
- Profile live camera: `/site/profile.html?v=phase366`
- Website dressing room: `/site/avatar.html?v=phase366`
- VR dressing room: `/game/avatar-vr.html?v=phase366`
- Quest: `/game/index.html?platform=quest&v=phase364`

## Runtime QA

```js
window.SVR_PHASE367_DEVICE_QA()
window.SVR_PHASE367_DEVICE_CALIBRATE()
window.SVR_PHASE367_DEVICE_STABILIZE()
window.SVR_PHASE367_DEVICE_STATE
```

The device state records:

```text
viewportWidth
viewportHeight
viewportScale
offsetLeft
offsetTop
orientation
viewportUpdates
orientationUpdates
stabilizationRequests
stabilizationApplied
stabilizationSkipped
pointerEvents
moveTouches
lookTouches
actionTouches
controllerRoots
moveControls
lookControls
actionPanels
visibleNavigationWhileSeated
```

## Acceptance

The Chromium release gate requires:

1. One Phase 347 controller root, MOVE stick, LOOK stick, and action panel.
2. Real pointer events recorded on MOVE, LOOK, and actions.
3. Portrait and landscape `visualViewport` dimensions applied to the stage.
4. Safe-area rules installed for the seated HUD.
5. JOIN TABLE hides MOVE, LOOK, LOBBY, and CENTER.
6. A resize burst cannot repeatedly hard-recenter the seated camera.
7. LEAVE TABLE restores lobby controls.
8. Phase 365 remains green.
9. Phase 366 profile camera and both dressing rooms remain green.
10. Full Hold’em still settles and conserves 90,000 chips.
11. No page errors, console errors, missing assets, or failed local requests.

## Product truth

- The current certified game remains local play-money Hold’em against five bots.
- Server-authoritative multiplayer is not claimed.
- Physical touch comfort and safe-area placement still require the owner’s real phone after deployment.
- No real-money gambling is implemented.

## APK policy

- Current APK: `0.1.0-rc1`
- Version code: `1`
- `releaseReady: false`
- `forceUpdate: false`
- `showUpdatePrompt: false`
- `manualUpdateOnly: true`

Phase 367 updates the remote web runtime. It does not require an APK reinstall.
