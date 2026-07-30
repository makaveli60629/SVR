# Phase 330 — Android UX Cleanup and Master Handoff Lock

Build: `PHASE-330-ANDROID-UX-CLEANUP-AND-MASTER-HANDOFF-LOCK`

## Routes
- Android: `https://svrpoker.com/game/android.html?channel=stable&v=phase330`
- Director: `https://svrpoker.com/game/index.html?preview=1&cam=director&autocam=1&embed=1&v=phase330-director`

## Locked changes
- One Android control root only.
- Left stick remains walk/strafe.
- Right stick remains look/turn.
- Card tray moved directly above the action buttons.
- Seated position moved closer to the existing table asset.
- Phase 329 duplicate-control cleanup changed from a second animation-frame loop to observer/interval cleanup.
- Director preview no longer shows a preview badge.
- Director table logo is created once instead of repeatedly rebuilt.
- Existing table asset remains the sole authority; Phase 330 creates no table.
- Android and director QA helpers report control, table, and overlay counts.

## APK policy
```json
{
  "apkVersionName": "0.1.0-rc1",
  "apkVersionCode": 1,
  "forceUpdate": false,
  "showUpdatePrompt": false,
  "webEntry": "/game/android.html?channel=stable"
}
```

## QA
Android:
```js
window.SVR_PHASE330_ANDROID_QA()
```

Director preview:
```js
window.SVR_DIRECTOR_PREVIEW_QA()
```

## Deploy audit
- Workflow exists at `.github/workflows/deploy.yml`.
- It runs on pushes to `main` and through manual dispatch.
- `game/docs/UPDATE_3_1_AUTO_DEPLOY_MARKER.md` records this phase.
- This branch does not deploy until merged to `main`.

## Protected
- Site untouched.
- Unapproved sponsor/partner content untouched.
- Quest/Oculus route remains separate.
- No native APK update is required.
