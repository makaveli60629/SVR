# Phase 342 Auto Deploy Marker

## Build
`PHASE-342-ADAPTIVE-PERFORMANCE-ASSET-PIPELINE-LOCK`

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`

## Payload
- `game/modules/phase342_adaptive_performance_asset_pipeline_lock.js`
- `game/tools/phase342_asset_audit.mjs`
- `game/modules/asset_base.js`
- `game/modules/phase340_platform_manifest.js`
- `.github/workflows/phase342-performance-audit.yml`
- `.github/workflows/phase342-asset-pipeline.yml`
- `app-update-checker.js`
- `sw.js`
- Android, Quest/desktop, and Camera 3 entries
- Phase 342 release manifests and documentation

## Locked performance behavior
- Android target: 45 FPS.
- Quest target: 72 FPS.
- Desktop target: 60 FPS.
- Camera 3 target: 30 FPS.
- Adaptive resolution changes require sustained pressure.
- Texture and shader prewarming remain enabled.
- Phase 341 table/card geometry remains authoritative.

## Locked update behavior
- APK version: `0.1.0-rc1`
- APK version code: `1`
- Forced update: `false`
- Automatic update prompt: `false`
- Manual update only: `true`

## Runtime QA
```js
window.SVR_PHASE342_AUDIT()
window.SVR_PHASE342_SET_QUALITY('balanced')
window.SVR_PHASE342_REPREWARM()
window.SVR_CHECK_FOR_APP_UPDATE()
```
