# Phase 169 — Expanded Lobby + Quest Hand Teleport + Left-to-Right Dealing Lock

## Objective
Fix the current blockers reported from live testing:

1. Game freezing / lobby too cramped.
2. Remove all generic background buildings.
3. Expand the lobby so hubs fit correctly.
4. Give hubs organized interactive pod-style modules with slide/display/portal structure.
5. Lock Quest hand teleport: look at hand, make fist, purple glow, aim, pinch to teleport.
6. Lock poker demo dealing order left-to-right.

## Files Changed

### `game/modules/lobby_octagon_phase168.js`
The existing Phase 168 module now performs the Phase 169 expanded layout pass.

Changes:
- Aggressively hides old background/building clutter by name scan.
- Hides old Phase 123 eight-building ad ring.
- Expands the octagon radius from the cramped shell to a much larger radius.
- Adds a larger solid no-gap octagon wall shell.
- Keeps four Tier 1 cardinal pillar buildings.
- Adds organized hub pods:
  - PGA Hub
  - Sponsor Hub
  - Wellness Hub
  - SVR Store
  - Scorpion Room
  - Legends Hub
- Each pod uses a display/slide panel plus a portal-ring visual.

### `game/modules/teleport.js`
Replaced the unstable teleport flow with a cleaner Phase 169 Quest locomotion lock.

Hand tracking behavior:
- Make a fist to arm teleport.
- Active hand shows purple glow.
- Purple ring/arc/pointer displays where the user is aiming.
- Pinch teleports to the target.
- Fist again cancels.

Controller behavior preserved:
- Right stick Y = forward/back.
- Right stick X = 45-degree snap turn.
- Left stick X = strafe fallback.
- Trigger/grip release teleport remains available.
- Controller aim still flips bad backward rays forward when needed.

### `game/modules/poker_demo.js`
Rebuilt the demo dealing flow to lock left-to-right player dealing.

Changes:
- Seats are sorted by X position from left to right.
- Deal order starts at the leftmost seat.
- Cards are dealt to the next player, then the next, until every player receives one card.
- Second card repeats the same left-to-right order.
- Runtime deal order is exposed at `window.SVR_PHASE169_DEAL_ORDER` for inspection.

## Important Runtime Markers
- `window.SVR_PHASE169_EXPANDED_LOBBY`
- `window.SVR_PHASE169_DEAL_ORDER`

## Test Checklist

### Lobby
1. Open `/game/` with a hard refresh.
2. Confirm old background buildings are gone.
3. Confirm the lobby feels bigger.
4. Confirm all hub pods fit without crowding the poker table.
5. Confirm four large Tier 1 pillar faces remain at North/South/East/West.
6. Confirm Legends hub is visible.

### Quest Hand Teleport
1. Enter VR with hand tracking.
2. Look at the hand.
3. Make a fist.
4. Confirm purple glow/ring/arc appears.
5. Aim at the floor.
6. Pinch.
7. Confirm teleport completes at the aimed location.
8. Make a fist again to cancel if armed.

### Controller Locomotion
1. Right stick forward/back follows head/camera direction.
2. Right stick left/right snap-turns 45 degrees.
3. Trigger/grip teleport still works.
4. Teleport ray should not appear behind the player.

### Poker Dealing
1. Watch card dealing.
2. First card starts at the leftmost player.
3. It deals to each next player in left-to-right order.
4. Second card repeats the same left-to-right order.

## Commits
- `43be1126e2b94fa41773720b29c484cc5fb8fcb8` — Lock Phase 169 Quest hand teleport locomotion.
- `fee8b94612c00b9e06223b1ebf1d53b21f180a77` — Expand Phase 169 lobby and remove background buildings.
- `1f41a256c020c519433cd0cfc1b85bac4e8d09bc` — Lock poker demo left-to-right dealing order.
