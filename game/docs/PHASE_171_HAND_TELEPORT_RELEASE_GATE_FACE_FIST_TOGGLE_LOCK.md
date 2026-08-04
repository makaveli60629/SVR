# Phase 171 — Hand Teleport Release Gate + Face Fist Toggle Lock

## Scope
Game-side only. No lobby redesign. No website/site file changes.

## User rule
The player must never jump/move when the hand first points or clenches. Movement happens only after the hand gesture is released.

## Added behavior
- Fist held in front of the face toggles teleport ON/OFF.
- The face-fist toggle does not aim and does not move the player.
- After toggling, the player must release the hand before any aim can start.
- Holding fist or pinch away from the face starts aim mode only if teleport is ON.
- The aim ray and target marker stay visible while held.
- Releasing the hand gesture moves the player to the selected marker.
- If teleport is OFF, hand gestures cannot move the player.
- The older base hand teleport path remains suppressed while Phase 171 owns hand teleport.
- If any older path moves the player during aim/disabled/toggle state, Phase 171 restores the pre-aim pose.

## Expected test sequence
1. Hold fist in front of face: teleport toggles ON.
2. Release the fist: no movement.
3. Hold fist or pinch away from face: aim ray appears.
4. Move the hand until marker is correct.
5. Release hand: move happens once.
6. Hold fist in front of face again: teleport toggles OFF.
7. Release the fist: no movement.

## Runtime audit
```js
SVR_RUN_PHASE171_HAND_TELEPORT_AUDIT()
```

## Test URL
`/game/?v=phase171-hand-release-gate`
