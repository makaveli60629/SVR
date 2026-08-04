# Phase 335 — Oculus Acceptance and Gameplay Stability Lock

## Build
`PHASE-335-OCULUS-ACCEPTANCE-GAMEPLAY-STABILITY-LOCK`

## Purpose
Phase 335 converts the Phase 334 table and gesture work into a stable Oculus playtest build that can remain playable through complete hands.

## Preserved systems
- Phase 332 denomination chips, pickup, gravity, throwing, bounce, spin, stacking, and pass-line commitment.
- Phase 333 Quest-safe shaders, lighting, turn panel, and XR action controls.
- Phase 334 professional pass line, proportional center logo, seated calibration, two-column chip layout, player-facing cards, burn/turn visuals, left-to-right dealing, Eric bots, and gesture poker.

## New stability layer
- Keeps legacy face-level pot, bet, status, audit, and desktop overlays hidden.
- Keeps the turn panel above the sightline and the action row at reachable table-edge height.
- Performs one conservative headset seat correction at XR session start only when the camera is still inside or below the accepted seated envelope.
- Debounces duplicate poker actions generated within 520 milliseconds.
- Recovers chips that fall below the table, fly outside the accepted table bounds, or produce invalid positions.
- Keeps hole/community cards visible, double-sided, and above the table surface.
- Keeps player cards facing the active headset camera.
- Maintains a maximum of five Phase 334 bot groups and keeps them facing the table.
- Attempts to reconstruct the Phase 333 action bar if it disappears during a human turn.
- Adds a small QA panel that is hidden by default and enabled only with `?qa=1` or a runtime helper.

## Runtime helpers
```js
window.SVR_PHASE335_TABLE_QA()
window.SVR_PHASE335_SHOW_QA()
window.SVR_PHASE335_HIDE_QA()
window.SVR_PHASE335_RECENTER()
window.SVR_PHASE335_RECOVER_TABLE()
```

## Oculus route
`https://svrpoker.com/game/index.html?v=phase335-oculus-stability`

## Acceptance sequence
1. Enter VR and confirm the player is seated outside the rail with the table below chest level.
2. Confirm the turn panel is above the cards and does not block the center of view.
3. Confirm Fold, Check/Call, Raise, All In, and Next Hand remain reachable.
4. Play a complete hand using buttons, gestures, or physical chips.
5. Throw chips and confirm lost chips recover to the table layout.
6. Confirm hole and community cards remain visible and face the player.
7. Confirm five Eric bot positions remain stable.
8. Confirm repeated pinches or triggers do not submit duplicate actions.
9. Confirm no old pot, bet, audit, or desktop displays reappear in front of the headset.

## Protected scope
- Game-side files only.
- Public website untouched.
- Sponsor and partner content untouched.
- Android stable touch route remains separate.
- APK remains `0.1.0-rc1`, code `1`, with no forced update.
- This phase does not claim networked multiplayer completion.
