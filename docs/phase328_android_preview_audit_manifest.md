# Phase 328 — Android + Director Preview Audit Manifest

## Phase
`PHASE-328-DIRECTOR-PREVIEW-TABLE-SHOWCASE-LOCK`

## Scope
- Android stable web route only.
- Director/third-camera preview route only.
- No public website redesign.
- No forced APK update.

## Source audit findings

### Android route
- `game/android.html` is the active Android web-game route.
- It loads the stable Android play stack and now includes the Phase 328 helper module.
- Stable channel remains `/game/android.html?channel=stable`.

### APK / native source
- The repo contains Android web route and release manifests.
- A native Gradle APK source project was not confirmed through the accessible GitHub source search.
- APK release remains blocked on package ID, versionCode, versionName, and signing/keystore confirmation.
- Tracking issue: `#109 Android APK release package/signing checklist`.

### Release policy
- `game/android-release.json` keeps `forceUpdate: false` and `showUpdatePrompt: false`.
- Testers should not receive update prompts for every game phase.
- Native APK should be rebuilt only for native shell/signing/permissions/icon/version changes, or after an approved stable Android batch.

### Director preview
- Existing site preview iframes use `preview=1`, `cam=director`, and `embed=1`.
- Phase 328 is wired into `game/index.html` only when preview/director/embed mode is active.
- Phase 328 cleans DOM/game overlays, adds a table-surface SVR logo, improves preview lighting, and drives a slow director orbit camera around the table.

## Added runtime helpers

```js
window.SVR_RUN_DIRECTOR_PREVIEW_POLISH()
window.SVR_PHASE328_PREVIEW
window.SVR_ANDROID_APK_RELEASE_POLICY
```

## Test routes

Android stable route:
```text
https://svrpoker.com/game/android.html?channel=stable
```

Director preview route:
```text
https://svrpoker.com/game/index.html?preview=1&cam=director&autocam=1&embed=1&v=phase328-director
```

## Next recommended Android work
1. Android seated card play state persistence.
2. Android button hit feedback and chip amount validation.
3. Android upstairs navigation collision/height guard.
4. Native APK wrapper creation only after package/signing info is confirmed.
