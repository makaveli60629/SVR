# Phase 98S-I — Android Two-Stick Mobile Controls Lock

Date: 2026-06-02
Track: game-side only

## Purpose

Add permanent Android/mobile testing controls so the game can be tested away from the PC.

## Files changed

- `game/modules/android_controls_lock.js`
- `game/index.html`
- `game/docs/PHASE_98S_I_ANDROID_TWO_STICK_CONTROLS_LOCK.md`

## What was added

- Mobile-only two-stick overlay.
- Left stick controls movement and strafe.
- Right stick controls turning.
- Touch/pointer safe controls.
- Hides in preview mode.
- Desktop and WebXR/Quest controller systems remain unchanged.

## Build label

`PHASE-98S-I-ANDROID-TWO-STICK-CONTROLS`

## Permanent lock rule

Android controls are now a required testing feature and should not be removed in future game phases.

## Runtime debug object

The module exposes:

```js
window.SVR_ANDROID_CONTROLS_LOCK
```

Expected on Android/touch device:

```js
{
  phase: "98S-I",
  installed: true,
  controls: "two-stick",
  leftStick: "move/strafe",
  rightStick: "turn",
  permanentLock: true
}
```

## Test route

Open on Android:

`/game/?v=phase98si-android-two-stick-controls`

Then verify:

1. Two sticks appear on mobile.
2. Left stick moves the camera.
3. Right stick turns the camera.
4. Controls are not shown in preview/camera mode.
5. Desktop still works as before.
6. WebXR session still hides regular page UI.

## Protected

- Reiki deploy lock preserved.
- Moon/Mars patch preserved.
- Runtime snap guard preserved.
- Site/public page untouched.
