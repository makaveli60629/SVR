# Phase 363 — Android Canonical Table, JOIN, Raise, Street Order, Bankroll, Audio, Gyro, and FOV Lock

## Objective

Correct the Android game so it starts in a true lobby state, deals cards only after the player explicitly joins the table, exposes one reliable JOIN/LEAVE control, supports a working raise flow, and follows the complete Texas Hold’em betting and burn-card sequence.

## Android table authority

The repository does not currently contain an OBJ poker table. Phase 363 therefore uses only verified committed assets:

1. `/game/assets/models/table.glb`
2. `/game/assets/table.fbx`

The GLB is preferred. The FBX is the verified fallback. The procedural emergency table cannot satisfy release acceptance.

## Lobby and seated state

### Lobby

- No player cards.
- No community-card HUD.
- No betting controls.
- One visible `JOIN TABLE` control.
- No visible SIT, SEAT, PLAY GAME, or duplicate JOIN controls.
- Free MOVE and LOOK controls remain available.
- Bankroll displays the fresh 15,000-chip buy-in.
- The poker engine is idle and cannot continue dealing.

### Seated

- `JOIN TABLE` changes to `LEAVE TABLE`.
- The camera uses the existing Phase 347 south/front seat.
- Two player cards are dealt only after joining.
- Community cards and poker actions become visible.
- The MOVE stick slides left/right.
- LOOK remains available.
- Gyro and touch drag add bounded head-look and small lateral parallax.

### Leave

- The hand is cleared from the Android view and engine record.
- The player returns to the lobby camera state.
- The poker HUD and cards are hidden.
- Timers cannot start another hand while the player remains in the lobby.
- Rejoining creates a fresh six-player test table.

## Texas Hold’em street contract

Phase 336 remains the dealing, burn-card, betting-round, hand-evaluation, pot, and payout authority. Phase 363 audits the required sequence:

| Street | Community cards visible | Burn cards used | Required player betting opportunity |
|---|---:|---:|---|
| Preflop | 0 | 0 | Yes |
| Flop | 3 | 1 | Yes |
| Turn | 4 | 2 | Yes |
| River | 5 | 3 | Yes |
| Showdown | 5 | 3 | After river betting completes |

The browser release gate fails if the game exposes community cards before preflop betting completes, skips a street, omits a burn card, or reaches showdown without the full board.

## Reliable RAISE flow

- The Android RAISE/BET button has one capture-stage event authority.
- Opening the amount drawer and confirming a raise use separate duplicate-event locks.
- The slider minimum is based on the current bet and minimum legal raise.
- The slider maximum is the player’s current bet plus remaining stack.
- A confirmed raise must increase the human player’s bet or the table current bet.
- Selecting the minimum raise cannot accidentally commit the entire 15,000-chip bankroll.
- RAISE works as BET when the current street has no existing wager.
- CHECK and CALL continue through the Phase 347 HUD and Phase 336 rules.

## Test bankroll

- Players: 6
- Starting stack per player: 15,000
- Total table bankroll: 90,000
- Blinds remain controlled by Phase 336.
- Stacks and payouts remain local play-money test data.
- A deliberate leave/rejoin restores 15,000 chips to every seat.
- Full-hand acceptance requires 90,000-chip conservation after settlement.
- Settled contributions are not counted twice after payout.

## Android integrated controls

Phase 347 remains the only Android MOVE, LOOK, and poker-button controller. Phase 363 does not add a second controller.

Capture-stage JOIN and RAISE authorities block older duplicate handlers before they can fire. Release acceptance requires exactly one visible JOIN/LEAVE control and one functional RAISE drawer.

## Gyro and touch drag

- Device orientation is calibrated from the first usable event.
- Gyro yaw, pitch, and lateral movement are smoothed.
- Single-finger drag adds bounded yaw and pitch.
- Buttons, links, sliders, MOVE, and LOOK sticks are excluded from drag handling.
- Device-orientation permission is requested only from a user gesture when the browser requires it.

## Responsive FOV

- Portrait FOV: 73–86 degrees depending on aspect ratio.
- Landscape FOV: 61 degrees.
- Camera aspect and renderer size update on resize/orientation changes.
- Android pixel ratio remains capped for performance.

## Web Audio and haptics

No checked-in chip/card sound files were found in the current repository. Phase 363 uses Web Audio synthesized effects without making requests to missing files.

Events:

- card shuffle
- card deal
- chip bet/call/raise
- chip collection
- fold
- sit down
- leave table
- player turn cue
- winner/pot payout

`navigator.vibrate()` provides supported Android haptics.

## Avatar and profile systems preserved

The existing avatar system remains connected:

- Website dressing room
- VR/WebXR dressing room
- Rotating pedestal
- Eric and Claudia starter bodies
- Profile live 3D showroom
- Android/Quest/PC avatar profile bridge

Routes:

- `/game/avatar-vr.html?v=phase353`
- `/site/avatar.html?v=phase346`
- `/site/profile.html?v=phase351`

Phase 363 does not replace the current avatar system with Gemini’s placeholder mannequin. It preserves the existing loaded avatar assets and profile bridge.

## Gemini architecture review

### Integrated in Phase 363

- Gyro smoothing plus touch drag
- Responsive mobile FOV
- Web Audio synthesized poker sounds
- Android vibration feedback
- Explicit lobby/seated state
- Cards hidden until JOIN
- Cards cleared after LEAVE
- Responsive Android HUD treatment
- Avatar/profile systems protected from regression

### Deferred to server-backed phases

These are useful ideas, but they are not represented as complete until production services exist:

- PostgreSQL/RDS bankroll persistence
- JWT or managed-login session continuity
- Cross-device profile synchronization
- Dynamic networked table carousel and live occupancy
- Multiplayer floating emotes
- Positional dealer voice streaming
- Production service-worker asset versioning and PWA install promotion

The local 15,000-chip bankroll is test play money. Browser local storage must not be treated as a secure production bankroll authority.

## Runtime QA

```js
window.SVR_PHASE363_QA()
window.SVR_PHASE363_STATE
window.SVR_PHASE363_TABLE_QA()
window.SVR_PHASE363_JOIN_CONTROL_QA()
window.SVR_PHASE363_RAISE_UI_CAPTURE_QA()
window.SVR_PHASE363_STREET_RAISE_QA()
window.SVR_PHASE363_CONSISTENCY_QA()
window.SVR_PHASE363_JOIN_TABLE()
window.SVR_PHASE363_LEAVE_TABLE()
window.SVR_PHASE363_RAISE_TO(100)
window.SVR_PHASE363_RESET_VIEW()
window.SVR_PHASE363_AUDIO.play('card_deal')
```

## Browser acceptance

The Android-sized Chromium gate must prove:

1. Lobby boot with zero visible cards.
2. Exactly one JOIN TABLE control.
3. JOIN seats the player and deals exactly two hole cards.
4. The minimum RAISE works through the real drawer and confirm control.
5. Preflop, flop, turn, river, and showdown occur in order.
6. Burn counts progress 0, 1, 2, 3.
7. The human completes an action on every betting street.
8. CHECK and CALL execute through Android HUD buttons.
9. Winner payout conserves 90,000 chips.
10. LEAVE clears the engine and visible cards and stops further dealing.
11. Rejoin starts a fresh six-player hand with 15,000 chips per seat.
12. No page errors, console errors, failed assets, or HTTP errors.

## APK policy

Unchanged:

- APK `0.1.0-rc1`
- version code `1`
- `releaseReady: false`
- `forceUpdate: false`
- `showUpdatePrompt: false`
- `manualUpdateOnly: true`

This phase updates the remotely loaded Android web runtime. It does not require an APK reinstall.
