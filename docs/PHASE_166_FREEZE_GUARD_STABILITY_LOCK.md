# Phase 166 — Freeze Guard Stability Lock

## Objective
Stop the game from freezing on Quest, Android, and mobile browser by adding an adaptive performance guard before the luxury lobby rebuild continues.

## What Changed

### 1. Adaptive Freeze Guard
File: `game/modules/performance_phase148.js`

- Keeps the existing performance module path so old imports do not break.
- Adds Phase 166 adaptive logic inside the existing performance module.
- Detects frame spikes.
- Automatically lowers render pixel ratio when spikes repeat.
- Increases optional tick stride when the device starts struggling.
- Stores runtime status in `window.SVR_PHASE166_FREEZE_GUARD`.
- Keeps Quest/WebXR foveation enabled.
- Keeps shadows off.
- Forces mobile/Quest material precision to `mediump`.
- Lowers high light intensity on mobile/Quest.
- Hides debug/helper/joint meshes on mobile/Quest when detected by name.

### 2. Game Loop Wiring
File: `game/main.js`

- New build label: `UPDATE-3.0-PHASE-166-FREEZE-GUARD-STABILITY-LOCK`.
- Adds `perf.reportFrame(rawDt, statusCb)` into the main animation loop.
- Uses capped simulation delta so a frame spike does not throw movement/animation forward violently.
- Preserves Android smart stick controls.
- Preserves Quest hand/controller locomotion.
- Preserves CAM 3 preview mode.

### 3. Loading Screen Preserved
File: `game/index.html`

- Logo loading screen remains permanent.
- Phase text updated to Phase 166.
- Cache-bust query updated to `phase166-freeze-guard-stability-lock`.

## Locked Rules
- Loading screen must stay.
- Quest locomotion must remain modular and untouched by hub polish.
- Android smart sticks remain Android-only.
- Desktop controls remain desktop-only.
- Future luxury hub work must build on this stability pass, not replace it.

## Test Checklist

### Quest
1. Open the game in Quest browser.
2. Enter VR.
3. Move with controllers/hands.
4. Watch for freezes during the first 60 seconds.
5. If frame spikes occur, status should show freeze guard adjustment.

### Android
1. Open the game on Android browser.
2. Confirm loading screen fits.
3. Use left stick to move.
4. Use right stick to look.
5. Confirm the game does not freeze after moving around.

### Desktop
1. Open the game on desktop.
2. Confirm keyboard/mouse still works.
3. Confirm Android overlay does not show.

## Commits
- `8cf51c310922160c775538aeee4d9df45e632e9b` — Add Phase 166 adaptive freeze guard.
- `d2ae38ade2b3acdf1a463f40cf1f0f58de23f8ee` — Wire Phase 166 freeze guard into game loop.
- `be48c8083a365693c4849281fd014dd8c4045d2c` — Update loading screen to Phase 166 freeze guard.
