# Phase 350 Auto Deploy Marker

## Build
`PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Phase 350 validation workflow: `.github/workflows/phase350-site-integrity-check.yml`

## Runtime payload
- `site/js/phase350-profile-avatar-recovery.js`
- `site/profile.html`
- `game/modules/phase350_camera3_visibility_lighting_lock.js`
- `game/modules/phase350_android_controller_dom_deduplication_lock.js`
- `game/modules/phase340_platform_manifest.js`
- `game/index.html`
- `game/android.html`
- `game/camera3.html`
- `game/manifest.json`
- `game/android-release.json`

## Website integrity payload
- `site/data/public-page-registry.json`
- `site/tools/phase350-site-integrity-audit.mjs`
- `site/roadmap.html`
- `game/tools/phase350-integrity-static-test.mjs`
- `.github/workflows/phase350-site-integrity-check.yml`
- Phase 350 documentation

## Profile avatar locks
- Immediate visible fallback before 3D loading.
- Bounded account, catalog, viewer-module, and model-loading time.
- Visible status and Retry controls.
- ResizeObserver fallback for older Android WebViews.
- Blank indefinite loading state is not permitted.

## Camera 3 locks
- Dedicated spectator lighting authority.
- Minimum five active lights.
- ACES filmic exposure at or above 1.1.
- Deep-navy background and fog removal.
- Shadows disabled.
- Camera 3 remains account/avatar/presence/controller free.

## Android controller locks
- Phase 347 remains the only visible controller authority.
- Legacy roots are physically removed, not only hidden.
- External virtual sticks are removed.
- Duplicate Phase 347 roots are removed.
- MutationObserver and periodic sweeps repair late duplicates.

## Website locks
- Canonical pages are release-blocking.
- Canonical local links/assets/anchors must resolve.
- Historical and optional pages remain visible as audit warnings.
- Site integrity report is uploaded for every Phase 350 PR.
- Public roadmap records completed, blocked, and next major milestones.

## Runtime QA
```js
window.SVR_PHASE350_PROFILE_AVATAR_QA()
window.SVR_PHASE350_PROFILE_AVATAR_RETRY()
window.SVR_PHASE350_CAMERA3_QA()
window.SVR_PHASE350_CAMERA3_RELIGHT()
window.SVR_PHASE350_ANDROID_CONTROLLER_QA()
window.SVR_PHASE350_ANDROID_CONTROLLER_SWEEP()
```

## APK release gate
- Current APK: `0.1.0-rc1`, code `1`
- Reserved next APK: `0.1.0-rc2`, code `2`
- Signed native package present: false
- `releaseReady`: false
- APK URL: empty
- Forced update: false
- Automatic update prompt: false
- Manual update only: true
