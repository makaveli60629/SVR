# Phase 340 Auto Deploy Marker

## Build
`PHASE-340-PLATFORM-CORE-EXTRACTION-AUTHORITY-LOCK`

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`

## Payload
- `game/modules/phase340_platform_manifest.js`
- `game/modules/phase340_runtime_authority_registry.js`
- `game/modules/phase340_platform_core_loader.js`
- `game/index.html`
- `game/android.html`
- `game/camera3.html`
- `game/manifest.json`
- `game/android-release.json`
- Phase 340 documentation

## Release lock
- APK `0.1.0-rc1`, code `1`
- Force update: false
- Update prompt: false
- Manual update only: true
