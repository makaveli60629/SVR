# Phase 298 — Hand Teleport Fix

## Goal

Fix Quest hand teleport so the player moves after aiming with hand gesture and letting go.

## Reported issue

- Hand gesture shows the teleport marker.
- The marker can be aimed at the floor.
- Letting go hides the marker.
- The player stays in place.

## Changed files

- `game/modules/teleport_phase298_hand_release_commit.js`
- `game/modules/movement_phase286_input_lock.js`
- `game/docs/PHASE_298_HAND_TELEPORT_FIX.md`

## Runtime fix

- Adds a Phase 298 wrapper around the active teleport rig.
- Caches the last valid floor marker while the hand gesture is active.
- When the gesture ends, checks whether the base rig moved the player.
- If the player did not move, sends the rig to the cached marker.
- Keeps controller fallback active.
- Keeps head-forward walking and snap turn active.

## Protected systems

- Website and `/site` were not touched.
- Poker logic was not touched.
- Lobby geometry was not touched.
- Watch controls were not touched.
- Private routes were not touched.
- Moon and Mars were not touched.

## VR test checklist

1. Enter Quest VR.
2. Pinch until the teleport marker appears.
3. Aim at a valid floor spot.
4. Let go.
5. Confirm the player moves to the marker.
6. Repeat with fist gesture.
7. Confirm controller teleport still works.
8. Confirm walking and snap turn still work.

## Test URL

`/game/?v=phase298-hand-teleport-fix`
