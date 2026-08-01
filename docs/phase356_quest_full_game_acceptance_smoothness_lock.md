# Phase 356 — Quest Full-Game Acceptance and Smoothness Lock

## Objective

Certify the current Quest WebXR route as a clean, complete local play-money poker stack before production accounts or server-authoritative multiplayer work continues.

## Critical Quest path

The Quest route loads these systems before social/profile work:

1. Runtime and uploaded-table foundation.
2. Lobby and spawn authority.
3. Phase 336 authoritative local poker rules and settlement.
4. Hands-first Quest table interaction.
5. Chip, shader, card, gesture, and Oculus stability layers.
6. Phase 356 Quest acceptance and renderer governor.
7. Settlement presentation.

Account activity, profile avatar loading, the in-game avatar, and multiplayer presence load afterward through the deferred manifest.

## Input locks

- Meta hand tracking remains primary.
- Right/left Quest controllers remain supported as fallback.
- Movement direction remains based on headset look direction.
- Snap turn remains 45 degrees.
- Teleport remains hold-to-aim and release-to-teleport.
- Android virtual controls are forbidden on the Quest route.

## Automated acceptance

The GitHub workflow launches Chromium with a Quest 3/Oculus Browser user agent and requires:

- Quest platform detection.
- Clean critical module load.
- WebXR renderer enabled.
- Hands and controller APIs available.
- No Android controller DOM.
- Uploaded poker table, center logo, raised pot display, two player-card meshes, and five community-card meshes.
- Complete preflop, flop, turn, river, and showdown sequence.
- Winner and settled pot.
- Exactly 6,000 chips conserved.
- NEXT HAND advances the hand number.
- No same-origin HTTP failures, request failures, page errors, or console errors.
- Critical startup under 45 seconds in CI.

## Physical Quest acceptance still required

A headless browser cannot prove physical tracking. The following remain a real-device checklist:

- Enter VR succeeds in Meta Quest Browser.
- Both tracked hands appear and pinch interaction works.
- Controller fallback appears only when controllers are active.
- Right-stick forward/back follows the headset direction.
- Right-stick left/right snap-turns 45 degrees.
- Teleport arc and SVR marker point in front of the player.
- Teleport cannot place the player upstairs, in the air, or outside the walkable floor.
- Seat calibration is comfortable and cards remain readable.
- Watch and hologram controls are reachable.

## Product truth

A passing Phase 356 workflow certifies the Quest browser stack and full local poker game against five bots. It does not certify physical hand tracking without a headset, and it does not claim server-authoritative internet poker.

## Test route

`https://svrpoker.com/game/index.html?platform=quest&v=phase356`

## Runtime QA

```js
window.SVR_PHASE356_QA()
await window.SVR_PHASE356_RUN_QUEST_FULL_GAME_ACCEPTANCE()
window.SVR_PHASE356_ACCEPTANCE_RESULT
window.SVR_PHASE356_STATE
```

## Protected locks

- Phase 336 poker and settlement authority.
- Phase 334 table layout and gesture poker.
- Phase 335 Oculus stability layer.
- Five bots plus one open south/front player seat.
- Left-to-right dealing.
- Android APK remains `0.1.0-rc1`, code `1`.
- Forced updates and recurring update prompts remain disabled.
