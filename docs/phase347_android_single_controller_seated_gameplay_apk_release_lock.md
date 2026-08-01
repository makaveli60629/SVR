# Phase 347 — Android Single Controller and APK Release Lock

## Build
`PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK`

Phase 347 replaces the overlapping Android control presentation with one final MOVE/LOOK controller and one poker action rail. It corrects reversed horizontal motion, locks SIT to the canonical south/front seat, limits seated movement to left/right sliding, keeps table look control, exposes authoritative hole/community cards as HUD and floating Android cards, restores the center logo, and raises the translucent pot display.

## Test route

`/game/android.html?channel=stable&v=phase347`

## Runtime QA

```js
window.SVR_PHASE347_QA()
await window.SVR_PHASE347_RUN_FULL_HAND_QA()
```

## APK truth

The web runtime is updated. A signed native APK is not present and cannot be represented as an update until the existing Android wrapper source and signing identity are restored. The optional update menu remains hidden until a verified APK URL, checksum, and newer version code are published.
