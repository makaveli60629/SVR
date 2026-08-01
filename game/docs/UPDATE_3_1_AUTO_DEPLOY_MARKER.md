# Phase 347 Auto Deploy Marker

## Build
`PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Android validation workflow: `.github/workflows/phase347-android-check.yml`

## Payload
- `game/modules/phase347_android_single_controller_seated_gameplay_apk_release_lock.js`
- `game/modules/phase340_platform_manifest.js`
- `game/android.html`
- `game/manifest.json`
- `game/android-release.json`
- `app-update-checker.js`
- `site/android/index.html`
- `site/downloads/index.html`
- `game/tools/phase347-android-static-test.mjs`
- Phase 347 documentation

## Android locks
- Exactly one visible MOVE/LOOK controller.
- Horizontal movement uses direct X mapping: left is left and right is right.
- SIT uses the canonical south/front table position.
- Seated MOVE is a left/right slide rail only.
- Seated LOOK remains available within controlled limits.
- Two authoritative player cards and five authoritative community cards.
- Seven Android-only camera-anchored floating card views.
- One Android center SVR logo.
- One raised translucent pot display.
- Phase 336 remains poker authority.
- Phase 344 remains single-fire/full-hand authority.

## Runtime QA
```js
window.SVR_PHASE347_QA()
await window.SVR_PHASE347_RUN_FULL_HAND_QA()
window.SVR_PHASE347_SIT()
window.SVR_PHASE347_RECENTER()
window.SVR_PHASE347_STATE
```

## APK release gate
- Current APK: `0.1.0-rc1`, code `1`
- Reserved next APK: `0.1.0-rc2`, code `2`
- Signed native package present: false
- Existing wrapper/signing identity present: false
- `releaseReady`: false
- APK URL: empty
- Forced update: false
- Automatic update prompt: false
- Manual update only: true
- Update menu appears only when a verified newer APK is actually published.
