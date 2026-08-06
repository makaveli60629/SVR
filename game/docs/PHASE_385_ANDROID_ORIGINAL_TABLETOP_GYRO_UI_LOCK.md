# Phase 385 — Android Original Tabletop + Gyroscope UI Lock

## Scope

Game-side Android presentation only. The website, Quest runtime, Eric dealer runtime, APK version policy, and Phase 380 deterministic poker engine remain unchanged.

## User-facing corrections

- Replaces the oversized six-panel grid presentation with five compact seat panels arranged around the poker table.
- Enlarges opponent hole-card previews.
- Enlarges community cards.
- Enlarges the local player's two hole cards and gives them a dedicated bottom seat area.
- Keeps names, bankrolls, dealer position, folded state, and winner highlighting attached to each seat.
- Uses the canonical uploaded table asset at `game/assets/models/table.glb` as the Android tabletop authority.
- Preserves `game/assets/table.fbx` only as the existing project fallback; no generated duplicate table is added.
- Adds a top-down Three.js camera with subtle device-orientation movement.
- Adds touch-drag table viewing as the fallback when gyroscope data is unavailable.
- Adds the SVR logo directly above the felt surface.
- Mirrors the numeric pot into visible 3D chip stacks on the tabletop.
- Preserves the existing chip-flight animation, winner banner, burn cards, hand evaluator, player actions, stacks, and rotating dealer.

## Runtime structure

- `game/android.html` routes the Android stable channel to `game/android-tabletop.html`.
- `game/android-tabletop.html` wraps the protected Phase 380/384 Android poker page and injects presentation-only Phase 385 assets.
- `game/styles/phase385_android_tabletop.css` controls compact seating and card readability.
- `game/modules/phase385_android_tabletop_3d.js` loads the original table, gyroscope camera, felt logo, and pot chips.
- `game/android-stable.html` remains the protected gameplay engine and fallback page.

## Performance rules

- Pixel ratio is capped at 1.45.
- Antialiasing and dynamic shadows are disabled.
- Pot chips use shared geometry and materials.
- Gyroscope movement is clamped and smoothed.
- The CSS felt remains visible if the original GLB cannot load.

## QA

Open:

`/game/android.html?channel=stable&v=phase385`

Then confirm:

1. JOIN NOW still controls entry.
2. Five compact opponents surround the table instead of filling large black rectangles.
3. Community and player cards are readable in portrait orientation.
4. The original uploaded table is visible beneath the UI.
5. The SVR logo is visible on the felt.
6. Pot changes create visible chips near the table center.
7. Tilting the Android phone changes the table viewing angle slightly.
8. Dragging on an empty part of the table provides a touch-look fallback.
9. Fold, Check/Call, Raise, All In, winner payout, and Next Hand remain functional.

## Build

`PHASE-385-ANDROID-ORIGINAL-TABLETOP-GYRO-UI-LOCK`
