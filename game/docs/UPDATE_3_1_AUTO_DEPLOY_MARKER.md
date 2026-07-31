# Phase 344 Auto Deploy Marker

## Build
`PHASE-344-ANDROID-FULL-HAND-ACCEPTANCE-INPUT-LOCK`

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`

## Payload
- `game/modules/phase344_android_full_hand_acceptance_input_lock.js`
- `game/modules/phase340_platform_manifest.js`
- `game/android.html`
- `game/manifest.json`
- `game/android-release.json`
- Phase 344 documentation

## Locked Android behavior
- One MOVE stick and one LOOK stick.
- Phase 343 organized HUD remains authoritative.
- Duplicate action taps are blocked before reaching Phase 336.
- Community-card HUD stays synchronized with Phase 336.
- Seated table view recovers only after sustained drift.
- Full-hand street and settlement history is recorded for QA.

## Runtime QA
```js
window.SVR_PHASE344_QA()
await window.SVR_PHASE344_RUN_FULL_HAND_QA()
window.SVR_PHASE344_RECENTER()
window.SVR_PHASE344_HISTORY
```

## Locked update behavior
- APK version: `0.1.0-rc1`
- APK version code: `1`
- Forced update: `false`
- Automatic update prompt: `false`
- Manual update only: `true`
