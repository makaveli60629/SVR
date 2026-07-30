# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: Android stable route and director preview / Phase 328

## Reason
Phase 328 keeps the Android stable release-candidate route active while improving the director preview route used by the website iframe. It adds a clean third-camera table showcase, removes preview overlays, adds a table-surface SVR logo, improves preview lighting, and preserves the no-forced-APK-update policy.

## Current handoff
- `game/android.html`
- `game/index.html`
- `game/modules/phase328_director_preview_table_showcase_lock.js`
- `game/android-release.json`
- `game/manifest.json`
- `docs/phase328_android_preview_audit_manifest.md`

## Notes
This updates web-game routing and release manifests only. It does not generate a signed native APK binary because package/signing/native source confirmation is still required.

## Trigger
2026-07-30 Phase 328 Android stable and director preview deploy trigger.
