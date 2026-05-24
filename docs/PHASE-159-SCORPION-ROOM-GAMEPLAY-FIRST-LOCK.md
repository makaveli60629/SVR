# PHASE-159-SCORPION-ROOM-GAMEPLAY-FIRST-LOCK

## Purpose

Phase 159 begins Scorpion private room gameplay on top of the Phase 158 private room runtime. This is the first poker gameplay pass inside the private Scorpion room.

## Files changed

- `game/private-scene.html`
- `game/modules/private_scene_runtime_phase159.js`
- `docs/PHASE-159-SCORPION-ROOM-GAMEPLAY-FIRST-LOCK.md`
- `update/version.json`

## Added

- Scorpion gameplay overlay active only in `scene=scorpion`.
- 20-second action timer.
- Left-to-right deal rule recorded.
- Large readable card text in the gameplay panel.
- Pot amount.
- Player and bot stack display.
- Street flow: preflop, flop, turn, river, showdown.
- Auto-check / auto-fold rule display.
- Winner banner state recorded in `window.SVR_PHASE159_LAST_WINNER`.

## Preserved

- Phase 158 private room runtime.
- Reiki, PGA, Lounge routes remain preserved.
- Official root `logo.png` branding.
- No music.
- No watch yet.
- Modular private room architecture.

## Test URL

```text
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase159-scorpion-gameplay
```

## Lobby route test

```text
https://svrpoker.com/game/?v=phase158-private-rooms
```

Then select Scorpion portal.

## Test order

1. Open Scorpion private room.
2. Confirm Phase 159 HUD/panel appears.
3. Confirm player cards are readable.
4. Confirm 20-second timer counts down.
5. Confirm hand advances through streets.
6. Confirm showdown/winner state appears.
7. Confirm Reiki/PGA/Lounge remain preserved.

## Next phase

Phase 160 should move the gameplay panel into true 3D table cards/banners and add pot/winner visual effects.
