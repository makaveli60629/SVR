# Phase 329 — Android Table Playtest UX Manifest

## Phase
`PHASE-329-ANDROID-TABLE-PLAYTEST-UX-LOCK`

## Scope
- Android stable web route only.
- No native APK version bump.
- No forced APK update.
- No public website redesign.
- No approved-platform changes outside Android stable play mode.

## Why this phase exists
The Android route is now the temporary primary testing path. Phase 329 turns the Android table mode into a cleaner playtest surface by keeping one control layer, preserving seated state, improving action feedback, and keeping player cards readable while seated.

## Improvements
1. Stronger duplicate-control cleanup.
2. One active Android control root guard.
3. Seated state persists in local storage.
4. Android card tray stays readable after deal/action cycles.
5. Player-facing 3D cards are rebuilt on the active table surface.
6. Table turn ring shows when it is the Android player's turn.
7. Action buttons receive valid/invalid visual states.
8. Button press feedback includes scale pulse and short vibration when supported.
9. Amount slider and step buttons stay bounded for Android playtesting.
10. Android renderer pixel ratio is capped for smoother mobile performance.
11. Android release policy remains no forced APK update.

## Runtime helpers
```js
window.SVR_ANDROID_ACTION("deal")
window.SVR_ANDROID_ACTION("check")
window.SVR_ANDROID_ACTION("call")
window.SVR_ANDROID_ACTION("raise")
window.SVR_ANDROID_DEAL_HAND()
window.SVR_ANDROID_SIT_TO_TABLE()
window.SVR_ANDROID_TABLE_PLAYTEST_QA()
window.SVR_PHASE329_ANDROID_UX_STATE
```

## Test route
```text
https://svrpoker.com/game/android.html?channel=stable&v=phase329
```

## Acceptance checks
- Only one Android stick/control set is visible.
- Sit button toggles between seated table mode and lobby mode.
- Deal shows two readable player cards in the Android tray and on the table surface.
- Turn banner clearly shows `YOUR TURN` or `SEATED • WAITING`.
- Invalid actions are dimmed.
- Valid actions are highlighted.
- The release manifest still reports `forceUpdate: false` and `showUpdatePrompt: false`.

## Next recommended work
`PHASE-330-ANDROID-STATE-AUTHORITY-LOCK`

That phase should connect the Android UI state to the shared poker table authority more tightly, so card identity, turn ownership, and action legality come from the central poker engine instead of the Android overlay acting as the temporary playtest coordinator.
