# Phase 361 — Quest Lobby Spawn, Play-Game Seat, Watch, and NPC Lock

## Owner-reported problem

On physical Oculus/Quest, the player started directly over the cards near the table center. The owner could not walk naturally to the open south/front seat before playing. The old Quest manifest loaded `p86_seated_lock.js` and `p87_scorpion_seat_authority.js`; both repeatedly forced a seated camera pose and disabled movement, teleport, and watch state.

## Corrected Quest flow

1. Quest starts standing behind the table in lobby mode.
2. Walking, headset-facing movement, 45-degree snap turn, and hold-to-aim/release-to-teleport remain available.
3. The player walks toward the poker table.
4. A visible in-world and HTML fallback control says **PLAY GAME**.
5. Selecting PLAY GAME seats the player at the canonical south/front chair.
6. While seated:
   - player X/Z position is anchored to the chair;
   - walking and teleport are disabled;
   - headset look remains free;
   - poker/card interactions remain available;
   - the watch remains visible;
   - the only game-controlled exit is **LEAVE TABLE**.
7. LEAVE TABLE restores locomotion/teleport and returns the player to the lobby spawn.
8. Phase 360 deliberate-leave and fresh-join logic is invoked, so a deliberate return starts a clean local practice table.

## Watch

The module first restores any existing watch/forearm/wrist object. If no usable watch appears, it creates a lightweight fallback watch attached to the left tracked hand, left controller, or camera. The watch displays PLAY/LOBBY or LEAVE/TABLE LOCKED state.

## Input

- HTML fallback button
- Quest controller `selectstart` ray against the in-world panel/watch
- Right-hand pinch near the in-world panel
- Keyboard QA fallback: `P` to play, `L` to leave

## NPC and Eric presentation

The phase monitors deferred models after boot:

- existing material maps are preserved;
- Eric receives a purple SVR fabric texture only on untextured meshes;
- other bot/NPC meshes receive a cyan SVR fabric texture only when untextured;
- skin-like meshes receive a lightweight skin texture fallback;
- Eric and visible table NPC roots are aligned toward the uploaded table center;
- shadows remain disabled for Quest performance.

## Removed Quest authorities

The Quest critical manifest no longer loads:

- `modules/p86_seated_lock.js`
- `modules/p87_scorpion_seat_authority.js`

Those files remain in the repository for historical compatibility but are forbidden in the Quest manifest.

## Protected systems

- Phase 336 authoritative local poker and settlement
- Phase 341 table/card coordinates
- Phase 358 uploaded table, Meta hands, controller fallback, Quest full-hand browser certification
- Phase 359 result presentation and continuous hand timer
- Phase 360 secure shuffle, deliberate leave reset, chip conservation, and next-hand guard
- Android Phase 360 route and APK `0.1.0-rc1` manual-only update policy
- Camera 3 and website routes

## Product truth

This is local play-money poker against five bots. It does not claim server-authoritative multiplayer, balances, or cards.

Automated checks can verify code, load order, full-hand regressions, and release policy. The exact room-scale spawn comfort, controller ray, real hand pinch, seated reach, watch angle, and perceived Eric facing direction require the owner's physical Quest test.

## Test route

`https://svrpoker.com/game/index.html?platform=quest&v=phase361`

## Runtime QA

```js
window.SVR_PHASE361_QA()
window.SVR_PHASE361_PLAY_GAME()
window.SVR_PHASE361_LEAVE_TABLE()
window.SVR_PHASE361_LOBBY_SPAWN()
window.SVR_PHASE361_RESEAT()
window.SVR_PHASE361_NPC_ALIGN()
window.SVR_PHASE361_STATE
```

## Physical Quest checklist

1. Start behind the table, not above the cards.
2. Walk and teleport before joining.
3. Approach the front/south side.
4. Select PLAY GAME.
5. Confirm eye position is at the chair edge and cards are reachable.
6. Look left/right around the table.
7. Try movement and teleport; neither should remove the player from the chair.
8. Confirm watch is visible.
9. Pick up both hole cards by pinch and controller trigger fallback.
10. Press LEAVE TABLE and confirm return to lobby movement.
11. Confirm Eric is textured and all visible players face the felt.
