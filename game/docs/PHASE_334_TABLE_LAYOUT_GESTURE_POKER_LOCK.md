# Phase 334 — Table Layout and Gesture Poker Lock

## Build
`PHASE-334-TABLE-LAYOUT-GESTURE-POKER-LOCK`

## Scope
Game-side Quest/Oculus poker-table correction only. The public website, sponsor content, partner content, Android APK package, and Android stable controls are not changed.

## Reported headset problems corrected
- The player was too close to and partly inside the table.
- The table view was too low.
- The large `YOUR TURN` / bet panel was directly in front of the headset.
- Multiple translucent status displays overlapped the player’s view.
- The action controls were visible but too far from the hands.
- The pass line was attached correctly but was the wrong size and shape.
- The center logo was too large.
- Player chips were placed off to the left instead of organized directly in front.
- Player cards could not be read reliably.
- Community cards did not consistently face the seated player.
- The older poker-core display could appear reversed.

## Seated view correction
The Phase 334 default adjustment moves the existing player pose:
- `3 inches` farther back
- `5 inches` higher

The correction is applied after the XR session starts so it uses the live seated/headset pose instead of replacing the full locomotion rig.

### In-headset calibration controls
A compact calibration row is positioned below the poker action controls:
- `BACK`
- `FWD`
- `UP`
- `DOWN`
- `LOCK`

Each movement step is one inch. The selected position is stored locally and reused. `LOCK` hides the four movement controls while keeping an `ADJUST` control available.

## Turn panel and action controls
- The Phase 333 turn/status panel is reduced to `72%` scale.
- It is moved to the far side of the table and raised above the direct sightline.
- It appears only during the human turn or showdown.
- The duplicate Phase 332 bet display, Phase 331 pot display, old flat pot label, and desktop poker-core panel are hidden in the headset view.
- Fold, Check/Call, Raise, All In, and Next Hand remain available.
- The action row is centered near the player-side rail and moved within hand/controller reach.

## Professional pass line and logo
- The decorative pass line is rebuilt as a table-fitted capsule/stadium oval instead of a generic ellipse.
- The white outer line and gold inner line remain flush with the felt.
- The oval sits near the felt perimeter with a consistent visual inset.
- The approved SVR logo remains centered and flush.
- The logo width is reduced to approximately `22%` of the playable felt width, capped at `0.82` world units.
- Older duplicate logo meshes are hidden.

## Two-column chip layout
The working Phase 332 chip geometry, denominations, pickup, gravity, throwing, bounce, friction, and stacking remain authoritative.

Directly in front of the player:
- **Left column:** available personal chip stacks and total chip balance.
- **Right column:** committed/called/raised chips, current bet, and pot display.

The personal stacks remain between the new decorative pass line and the existing invisible commit boundary. This keeps the stacks visually inside the professional table oval without automatically committing them as bets.

When an action button or gesture performs a call, raise, or all-in, matching available chips are moved to the right committed-bet column. Physically thrown chips continue using the Phase 332 gravity and commit system.

## Cards and dealing
- Human hole cards are moved to the player-side edge.
- Hole cards face the live headset camera.
- Cards may be pinched/picked up.
- Community cards hover slightly above the center felt and face the player.
- Community cards are ordered left to right.
- A left-to-right two-round deal animation plays at the beginning of each hand.
- One burn card is removed from the remaining deck for flop, turn, and river.
- The visible burn pile grows to one, two, and three cards as the streets advance.

## Gesture poker language
### Check / Call / Next Hand
Knock downward on the player-side table area.
- If no call amount is required: `CHECK`.
- If a call amount is required: `CALL`, with chips moved to the committed-bet column.
- At showdown or idle: starts the next hand.

### All In
Push both hands forward toward the center of the table at the same time. All remaining available chips move to the committed-bet area and the poker engine receives `ALL IN`.

### Fold
Pinch/pick up either hole card and throw it toward the center. The cards animate into the muck and the poker engine receives `FOLD`.

### Physical chips
Pinch or controller-trigger pickup remains available. Released chips retain velocity, gravity, bounce, spin, friction, stack snapping, and pass-line commitment behavior from Phase 332.

## Eric bots
The repository’s existing Eric FBX model is loaded once and cloned into the five bot positions around the table. The existing Eric idle animation is applied when compatible. If the asset cannot load, a lightweight seated fallback mannequin is used instead.

The bots are visual occupants for the existing five computer-player logic. This phase does not add networked multiplayer authority.

## Runtime helpers
```js
window.SVR_PHASE334_TABLE_QA()
window.SVR_PHASE334_REAPPLY_LAYOUT()
window.SVR_PHASE334_SEAT_ADJUST({ backInches: 1, upInches: 1 })
window.SVR_PHASE334_SHOW_CALIBRATION()
window.SVR_PHASE334_GESTURE_ACTION("knock")
window.SVR_PHASE334_GESTURE_ACTION("push-all-in")
window.SVR_PHASE334_GESTURE_ACTION("throw-fold")
```

## Oculus test route
```text
https://svrpoker.com/game/index.html?v=phase334-table-gesture
```

## Acceptance checks
1. Player starts approximately three inches farther from the table.
2. Player view is approximately five inches higher.
3. Player is not standing inside the table geometry.
4. The turn panel is above and beyond the direct card sightline.
5. Only one turn/status display is visible.
6. Action controls are reachable by hand or controller.
7. Calibration controls move the player in one-inch steps.
8. Pass line follows a clean capsule oval near the felt perimeter.
9. Center logo is proportional and no longer dominates the felt.
10. Available chips are organized in the left front column.
11. Bet/pot chips and totals are organized in the right front column.
12. Existing chip gravity still works.
13. Hole cards face the player and can be picked up.
14. Community cards hover and face the player.
15. Deal animation travels left to right.
16. Burn pile shows one card on flop, two on turn, and three on river/showdown.
17. Table knock performs Check/Call or Next Hand when valid.
18. Two-hand forward push performs All In.
19. Throwing a hole card toward center performs Fold.
20. Five Eric bot visuals occupy the computer seats.
21. Public website and sponsor/partner content remain untouched.
22. APK remains `0.1.0-rc1`, code `1`, with no forced update.

## Validation status
- Phase 334 JavaScript passed `node --check` before publication.
- Updated JSON manifests parsed successfully.
- Live headset acceptance is still required for final reach, height, and model-scale confirmation.
