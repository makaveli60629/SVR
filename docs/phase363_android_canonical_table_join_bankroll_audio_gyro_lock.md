# Phase 363 — Android Canonical Table, JOIN, Bankroll, Audio, Gyro, and FOV Lock

## Objective

Correct the Android game so it starts in a true lobby state and deals cards only after the player explicitly joins the table.

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
- Free MOVE and LOOK controls remain available.
- Bankroll displays the fresh 15,000-chip buy-in.

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
- Rejoining creates a fresh six-player test table.

## Test bankroll

- Players: 6
- Starting stack per player: 15,000
- Total table bankroll: 90,000
- Blinds remain controlled by Phase 336.
- Stacks and payouts remain local play-money test data.
- A deliberate leave/rejoin restores 15,000 chips to every seat.
- Full-hand acceptance requires 90,000-chip conservation after settlement.

## Android integrated controls

Phase 347 remains the only Android MOVE, LOOK, and poker-button controller. Phase 363 does not add a second controller.

A capture-stage JOIN authority blocks older SIT, SEAT, and PLAY GAME handlers before they can fire. Release acceptance requires exactly one visible JOIN/LEAVE control.

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

## Runtime QA

```js
window.SVR_PHASE363_QA()
window.SVR_PHASE363_STATE
window.SVR_PHASE363_TABLE_QA()
window.SVR_PHASE363_JOIN_CONTROL_QA()
window.SVR_PHASE363_JOIN_TABLE()
window.SVR_PHASE363_LEAVE_TABLE()
window.SVR_PHASE363_RESET_VIEW()
window.SVR_PHASE363_AUDIO.play('card_deal')
```

## APK policy

Unchanged:

- APK `0.1.0-rc1`
- version code `1`
- `releaseReady: false`
- `forceUpdate: false`
- `showUpdatePrompt: false`
- `manualUpdateOnly: true`

This phase updates the remotely loaded Android web runtime. It does not require an APK reinstall.
