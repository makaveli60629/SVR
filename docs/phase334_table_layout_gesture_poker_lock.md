# Phase 334 — Table Layout and Gesture Poker Lock

Master handoff for `game/docs/PHASE_334_TABLE_LAYOUT_GESTURE_POKER_LOCK.md`.

## Build
`PHASE-334-TABLE-LAYOUT-GESTURE-POKER-LOCK`

## Main corrections
- Player starts three inches farther back and five inches higher.
- In-headset one-inch seat calibration controls: Back, Forward, Up, Down, Lock.
- Turn panel is smaller, higher, farther away, and only visible during the human turn or showdown.
- Duplicate face-level bet, pot, poker-core, and status displays are hidden.
- Fold, Check/Call, Raise, All In, and Next Hand controls are moved within hand reach.
- Pass line is rebuilt as a professional capsule oval fitted near the felt perimeter.
- Center SVR logo is reduced to a proportional size.
- Player chips are organized into two front zones: available stack/total on the left and committed bet/pot on the right.
- Existing Phase 332 chip gravity, throwing, bounce, spin, friction, and stack snapping remain active.
- Hole cards and hovering community cards face the player.
- Hole cards can be picked up and thrown toward center to fold.
- Deal animation runs left to right for two rounds.
- Flop, turn, and river each remove one burn card from the remaining deck and update the visible burn pile.
- Table knock performs Check/Call or Next Hand when valid.
- Two-hand forward push performs All In.
- The existing Eric FBX model is cloned into all five computer-player seats, with fallback mannequins if loading fails.

## Protected scope
- Existing uploaded table remains authoritative.
- Public website untouched.
- Sponsor and partner content untouched.
- Android stable route unchanged.
- APK stays `0.1.0-rc1`, code `1`.
- No forced APK update.
- No networked multiplayer claim.

## Test route
`https://svrpoker.com/game/index.html?v=phase334-table-gesture`

## QA
```js
window.SVR_PHASE334_TABLE_QA()
window.SVR_PHASE334_REAPPLY_LAYOUT()
window.SVR_PHASE334_SEAT_ADJUST({ backInches: 1, upInches: 1 })
window.SVR_PHASE334_SHOW_CALIBRATION()
```

Static JavaScript and JSON validation passed before publication. Final visual, reach, height, and Eric-model scale acceptance requires the live Oculus headset.
