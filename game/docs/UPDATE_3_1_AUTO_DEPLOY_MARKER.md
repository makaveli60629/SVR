# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: Android stable route / Phase 329 table playtest UX

## Reason
Phase 329 improves the Android stable game route without forcing a native APK update. It adds stronger one-control-set guarding, seated-state persistence, table-facing card display refresh, action button highlighting, button feedback, amount control cleanup, Android performance guard, and QA helpers for Android table testing.

## Current handoff
- `game/android.html`
- `game/phase329_android_table_playtest_ux_lock.js`
- `game/phase326_android_playable_polish_lock.js`
- `game/android-release.json`
- `docs/competition_footage_reference_manifest_2026_07_30.md`

## Notes
This updates the web-game Android route only. It does not force a native APK update and does not redesign the public website.

## Trigger
2026-07-30 Phase 329 Android table playtest UX deploy trigger.
