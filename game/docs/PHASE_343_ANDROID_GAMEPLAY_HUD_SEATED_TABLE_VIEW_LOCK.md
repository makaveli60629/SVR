# Phase 343 — Android Gameplay HUD and Seated Table View Lock

## Build
`PHASE-343-ANDROID-GAMEPLAY-HUD-SEATED-TABLE-VIEW-LOCK`

## Screenshot-derived corrections
- Removed the permanently expanded raise slider from normal gameplay.
- Removed the redundant LOBBY / SEAT / CENTER quick-position row.
- Hid the old large `SEATED • WAITING`, card, and status panels.
- Kept exactly one MOVE stick and one LOOK stick.
- Rebuilt the poker action rail as a centered 3 × 2 grid above the sticks.
- Added a compact top status bar and one recenter control.
- Added five community-card slots and two hole-card slots sourced from Phase 336.

## Seated table view
The previous Android seat code used a fixed minimum setback of 2.55 meters. Phase 343 instead measures the canonical Phase 341 table and places the Android camera at the south/front seat using:

- table center
- table surface height
- playable table depth
- a clamped seat distance of 1.10–1.55 meters
- a look target centered slightly into the felt

The position and view are applied repeatedly during the first 520 ms so late rig updates cannot move the player back to the old distant view.

## Raise workflow
- Tap `RAISE` to open the amount drawer.
- The drawer derives its minimum, maximum, and step from the Phase 336 betting state.
- Tap the drawer’s `RAISE` button to call `SVR_POKER_RAISE_TO` once.
- The drawer closes after submission.

## Runtime QA
```js
window.SVR_PHASE343_QA()
window.SVR_PHASE343_SIT()
window.SVR_PHASE343_LEAVE()
window.SVR_PHASE343_STATE
```

The QA checks one controller root, one MOVE stick, one LOOK stick, five community slots, two hole-card slots, six action buttons, control overlap, table availability, seated camera distance, and whether the table center is inside the camera view.

## Protected locks
- Phase 336 remains poker-ledger authority.
- Phase 341 remains table/card coordinate authority.
- Phase 342 remains performance authority.
- APK remains `0.1.0-rc1`, code `1`.
- Forced and recurring update prompts remain disabled.
