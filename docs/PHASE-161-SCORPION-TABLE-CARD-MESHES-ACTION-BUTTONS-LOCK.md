# PHASE-161-SCORPION-TABLE-CARD-MESHES-ACTION-BUTTONS-LOCK

## Purpose

Phase 161 moves the Scorpion poker gameplay from a pure overlay into a table-level visual layer with card lanes and action buttons.

## Files changed

- `game/private-scene.html`
- `game/modules/private_scene_runtime_phase161.js`
- `docs/PHASE-161-SCORPION-TABLE-CARD-MESHES-ACTION-BUTTONS-LOCK.md`
- `update/version.json`

## Added

- Table-style card visual layer.
- Hero card lane.
- Board card lane.
- Bot card lane with SVR card backs until showdown.
- Dealer / left-to-right marker.
- Pot marker on the table.
- Action buttons:
  - Check
  - Call Auto
  - Raise +25
  - Fold
- 20-second action timer remains active.
- Auto-check on timeout when free.
- Fold/call/raise state recorded.

## Preserved

- Phase 160 card flow/winner banner base.
- Phase 158 private room runtime.
- Official root `logo.png` branding.
- No music.
- No watch yet.
- Modular private room architecture.

## Test URL

```text
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase161-table-actions
```

## Next phase

Phase 162 should add seat/turn indicators and begin careful watch reintroduction without breaking locomotion.
