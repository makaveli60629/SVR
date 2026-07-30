# Phase 330 — Android UX Cleanup and Master Handoff Lock

## Build
`PHASE-330-ANDROID-UX-CLEANUP-AND-MASTER-HANDOFF-LOCK`

## Repository
- Repository: `makaveli60629/SVR`
- Base branch audited: `main`
- Android stable route: `https://svrpoker.com/game/android.html?channel=stable&v=phase330`
- Director preview route: `https://svrpoker.com/game/index.html?preview=1&cam=director&autocam=1&embed=1&v=phase330-director`

## Platform priority
Android is the temporary primary development and test platform because the owner currently has no PC access. Quest/Oculus and desktop/director preview remain supported secondary routes.

## Audit results

### Passed before Phase 330
- `game/android.html` exists and points to the stable Android channel.
- `.github/workflows/deploy.yml` exists.
- Auto Deploy is configured for pushes to `main` and manual workflow dispatch.
- `game/android-release.json` keeps APK version `0.1.0-rc1`, version code `1`, `forceUpdate: false`, and `showUpdatePrompt: false`.
- The existing uploaded table asset is already prioritized ahead of the emergency fallback.
- Phase 329 exposes Android action, sit, deal, state, and QA helpers.

### Drift found
- Phase 329 performed control cleanup on every animation frame even though movement is already handled by the Phase 326 loop.
- Android loaded the Phase 328 director-preview module even on the gameplay route.
- The Android card tray was centered away from the right-side action buttons.
- The Phase 329 seat offset placed the camera farther from the table than needed for touch play.
- The director preview created a visible preview badge even though the preview route must contain no overlays.
- Phase 328 rebuilt the surface logo on a repeating timer.
- Existing QA did not report table-authority count, complete control-root count, or director overlay count.

## Phase 330 changes

### Android UX
- Keeps exactly one visible Android control root.
- Keeps exactly one left move stick and one right look/turn stick.
- Uses a MutationObserver plus a slow QA monitor instead of a second per-frame cleanup loop.
- Moves the card tray directly above the right-side action button cluster.
- Keeps the raise slider and step buttons.
- Keeps valid actions highlighted and invalid actions dimmed.
- Removes RC/phase QA badges from the player-facing Android screen.
- Uses a closer south/front seated offset and aims the camera at the table surface.

### Table authority
- Uses these existing table roots in priority order:
  1. `PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED`
  2. `PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT`
  3. `PHASE326_ANDROID_TABLE_FALLBACK`
- Does not create a new Phase 330 table.
- Treats ancestor/descendant table nodes as one authority chain.
- Suppresses separate duplicate table roots if more than one authority chain is present.

### Director preview
- Removes the visible preview badge.
- Keeps Android controls, HUD, debug panels, labels, hitboxes, raycasts, and phase overlays hidden.
- Creates the table logo once instead of rebuilding it repeatedly.
- Keeps the slow director orbit.
- Adds a QA helper that reports DOM overlay count, scene overlay count, Android control count, and table-authority count.

### APK policy
No native shell/package/signing/version change was made.

Locked policy:
```json
{
  "apkVersionName": "0.1.0-rc1",
  "apkVersionCode": 1,
  "forceUpdate": false,
  "showUpdatePrompt": false,
  "webEntry": "/game/android.html?channel=stable"
}
```

### Deploy verification
- Workflow path: `.github/workflows/deploy.yml`
- Trigger: push to `main`
- Manual trigger: `workflow_dispatch`
- Phase update marker: `game/docs/UPDATE_3_1_AUTO_DEPLOY_MARKER.md`
- The Phase 330 branch and draft pull request do not deploy until merged to `main`.

## Runtime helpers

### Existing helpers preserved
```js
window.SVR_ANDROID_TABLE_PLAYTEST_QA()
window.SVR_PHASE329_ANDROID_UX_STATE
window.SVR_ANDROID_ACTION("deal")
window.SVR_ANDROID_ACTION("check")
window.SVR_ANDROID_ACTION("call")
window.SVR_ANDROID_ACTION("raise")
window.SVR_ANDROID_SIT_TO_TABLE()
window.SVR_ANDROID_APK_RELEASE_POLICY
window.SVR_PHASE328_PREVIEW
window.SVR_RUN_DIRECTOR_PREVIEW_POLISH()
```

### Phase 330 helpers
```js
window.SVR_PHASE330_ANDROID_QA()
window.SVR_ANDROID_MASTER_QA()
window.SVR_DIRECTOR_PREVIEW_QA()
window.SVR_PHASE330_ANDROID_UX_STATE
window.SVR_PHASE330_DIRECTOR_PREVIEW_STATE
window.SVR_PHASE330_MASTER_STATE
```

## Acceptance checks

### Android
Run:
```js
window.SVR_PHASE330_ANDROID_QA()
```

Expected key values:
```js
{
  controls: { oneControlSet: true },
  tables: { count: 1 },
  cardTrayCount: 1,
  releasePolicy: { forceUpdate: false, showUpdatePrompt: false },
  pass: true
}
```

### Director preview
Run:
```js
window.SVR_DIRECTOR_PREVIEW_QA()
```

Expected key values:
```js
{
  overlayCount: 0,
  androidControlCount: 0,
  tableAuthorityCount: 1,
  pass: true
}
```

## Protected scope
- Public website was not redesigned or edited.
- Unapproved sponsor/partner content was not edited.
- Quest/Oculus entry was not merged into the Android route.
- No new table asset was created.
- No APK version bump or forced update was introduced.
