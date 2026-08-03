# Phase 367 — Android Physical-Device Viewport Acceptance Lock

## Objective

Adapt the certified Phase 365 Android poker experience to real Android browser and APK-WebView viewport changes without creating another controller, table, camera, poker, avatar, or profile authority.

## New Android-only behavior

- Uses `window.visualViewport` for the active game-stage width and height.
- Applies Android safe-area insets to the bankroll, hole cards, turn panel, actions, and brand slot.
- Debounces browser resize and orientation changes.
- Allows one Phase 365 seated stabilization correction after a material viewport change.
- Enforces a minimum 900 ms interval between stabilization corrections to prevent bounce.
- Records pointer activity on the existing MOVE, LOOK, and poker-action controls.
- Audits the real controller DOM IDs:
  - `svr347Root`
  - `svr347Move`
  - `svr347Look`
- Audits that LOBBY, CENTER, and CENTER VIEW navigation remain invisible while seated.

## Protected authorities

Phase 367 does not replace:

- Phase 336 poker rules, deck, turns, pots, evaluation, and payout.
- Phase 347 single Android controller.
- Phase 350 controller DOM deduplication.
- Phase 351 profile 3D showroom.
- Phase 353 VR dressing room and moving pedestal.
- Phase 354 complete local-game acceptance.
- Phase 363 JOIN/LEAVE, bankroll, raises, streets, and synthesized audio.
- Phase 364 table geometry and floor alignment.
- Phase 365 table reference line, transparent pot, seated HUD, gyro/touch look, opponent alignment, and branding.
- Phase 366 profile live-camera and dressing-room reliability.

## Routes

- Android: `/game/android.html?channel=stable&v=phase367`
- Profile live camera: `/site/profile.html?v=phase366`
- Website dressing room: `/site/avatar.html?v=phase366`
- VR dressing room: `/game/avatar-vr.html?v=phase366`

## Runtime QA

```js
window.SVR_PHASE367_DEVICE_QA()
window.SVR_PHASE367_DEVICE_CALIBRATE()
window.SVR_PHASE367_DEVICE_STABILIZE()
window.SVR_PHASE367_DEVICE_STATE
```

## Acceptance

The automated Android browser gate must verify:

1. One Phase 347 controller root, one MOVE control, and one LOOK control.
2. Pointer activity is recorded for MOVE, LOOK, and actions.
3. JOIN TABLE keeps seated navigation hidden.
4. Landscape and portrait visual viewport dimensions are applied.
5. Orientation stabilization remains bounded.
6. Phase 365 seated UX acceptance still passes.
7. The complete local Hold'em hand still reaches settlement and conserves 90,000 table chips.
8. No browser errors or failed same-origin requests occur.

Physical comfort, actual phone safe-area appearance, and real touch use remain subject to the owner device playtest after deployment.

## APK policy

- APK version: `0.1.0-rc1`
- Version code: `1`
- `releaseReady: false`
- `forceUpdate: false`
- `showUpdatePrompt: false`
- `manualUpdateOnly: true`

Phase 367 is a remotely loaded web-runtime update. It does not require an APK reinstall.
