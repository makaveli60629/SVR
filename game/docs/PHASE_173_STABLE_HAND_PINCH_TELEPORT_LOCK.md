# Phase 173 — Stable Hand Pinch Teleport Lock

## Scope
Game-side control fix. No website/site changes.

## User rule
Hand pinch/fist must not move the player unless the teleporter is ON. Even when ON, the player must not move while holding the gesture. Movement happens only once after the gesture is released and the target has been stable.

## Fixes
- Pinch/fist gestures are ignored while teleport is OFF.
- Old hand teleport movement is suppressed and corrected if it moves the player while OFF.
- A target must stay stable before a release can move the player.
- If the hand target is shaking or drifting, release cancels instead of moving.
- Movement is armed only once per hold cycle.
- Holding still does not repeatedly move the player.
- Fist near face remains the ON/OFF toggle.

## Constants
- Minimum aim hold: 550 ms
- Stable target required: 520 ms
- Target drift limit: 0.075 world units

## Runtime audits
```js
SVR_RUN_PHASE173_HAND_TELEPORT_AUDIT()
SVR_RUN_PHASE170_TELEPORT_AUDIT()
```

## Test URL
`/game/?v=phase173-stable-hand-pinch`

## Expected test
1. Teleporter OFF.
2. Pinch/fist anywhere away from face.
3. Player must not move.
4. Fist near face toggles ON.
5. Release fist: no movement.
6. Hold pinch/fist away from face: aim appears.
7. Keep hand still until marker turns ready.
8. Release: move happens once.
9. Stand still after release: no repeated movement.
