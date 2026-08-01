# Phase 358 — Quest Full-Game Acceptance and Smoothness Lock

## Objective

Certify the Quest WebXR browser stack for a complete local play-money hand while improving the critical startup path.

## Critical Quest boot

1. Defer shader precompilation and allow normal frame compilation.
2. Start the protected Quest runtime and renderer budget.
3. Load the base game scene.
4. Load and normalize the uploaded FBX poker table.
5. Build canonical table and card presentation.
6. Start the Phase 336 poker engine and rules bridge.
7. Load hands, controller fallback, gestures, chip presentation, and Oculus stability.
8. Load settlement and the raised pot display.
9. Load Phase 358 acceptance last.

Lobby decoration, account activity, profile avatar, in-game avatar, and presence load after the table is playable.

## Input contract

- Meta hand tracking remains primary.
- Quest controller fallback remains available.
- Forward movement follows headset look direction.
- Snap turn remains 45 degrees.
- Teleport remains hold-to-aim and release-to-teleport.
- Android controller roots are removed from Quest.

## Automated browser acceptance

The Quest 3 user-agent Chromium run must verify:

- Quest platform detection.
- Clean critical module load.
- Hands-primary and controller-fallback contracts.
- Zero Android controls.
- Uploaded table authority with no fallback table remaining.
- Center logo and raised pot display.
- Two player-card meshes and five community-card meshes.
- Preflop, flop, turn, river, and showdown.
- Winner and settled pot.
- Exactly 6,000 chips conserved.
- NEXT HAND advancement.
- Startup under 45 seconds.
- Zero page, console, same-origin HTTP, and request failures.

## Product truth

A green workflow certifies the browser-based Quest stack and the complete local game against five bots. It does not prove real hand joints, controller sticks, room-scale tracking, teleport direction, seated reach, or comfort. Those require the physical Quest headset checklist.

This phase does not claim server-authoritative multiplayer, server-authoritative cards, or server-authoritative balances.

## Protected locks

- Phase 336 poker rules and settlement.
- Phase 341 table and card coordinates.
- Left-to-right dealing.
- Five bots plus one open south/front player seat.
- Phase 347 Android single controller.
- Phase 356 Android freeze recovery.
- Phase 357 Android close seating and showdown presentation.
- APK `0.1.0-rc1`, code `1`.
- Forced and recurring APK prompts remain disabled.

## Test route

`https://svrpoker.com/game/index.html?platform=quest&v=phase358`

## Runtime QA

```js
window.SVR_PHASE358_QA()
await window.SVR_PHASE358_RUN_QUEST_FULL_GAME_ACCEPTANCE()
window.SVR_PHASE358_ACCEPTANCE_RESULT
window.SVR_PHASE358_UPLOADED_TABLE_QA()
window.SVR_PHASE358_POKER_BOOT_QA()
window.SVR_PHASE358_POT_DISPLAY_QA()
window.SVR_PHASE358_QUEST_SHADER_QA()
```

## Physical Quest checklist

1. Enter VR with hand tracking enabled.
2. Confirm both hands appear and table gestures respond.
3. Confirm controller fallback works without visible controller meshes.
4. Confirm right-stick forward follows headset direction.
5. Confirm left/right snap turn is 45 degrees.
6. Confirm grip/A/trigger or hand hold aims teleport and release teleports.
7. Sit at the open south/front seat and verify cards, pot, and controls are reachable.
8. Complete multiple hands and start the next hand.
