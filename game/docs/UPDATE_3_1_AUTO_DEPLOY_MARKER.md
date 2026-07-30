# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: Android release candidate / Phase 327 APK update policy lock

## Reason
Phase 327 locks the Android game into a stable release-candidate channel so the app can point at one stable Android game route without prompting testers to update after every phase. APK updates are held until a stable Android playtest batch is approved and the APK versionCode/package/signing needs to change.

## Current handoff
- `game/android.html`
- `game/phase327_android_apk_release_candidate_lock.js`
- `game/android-release.json`
- `game/manifest.json`
- `android/index.html`
- `site/downloads/index.html`

## Notes
This phase updates the website Android/download pages and web-game Android route. It does not generate a signed native APK binary because no Android native source/signing setup was found in the repo search.

## Trigger
2026-07-30 Phase 327 Android APK release candidate deploy trigger.
