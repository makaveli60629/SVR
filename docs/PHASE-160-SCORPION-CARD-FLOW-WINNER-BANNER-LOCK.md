# PHASE-160-SCORPION-CARD-FLOW-WINNER-BANNER-LOCK

## Purpose

Phase 160 upgrades the Scorpion private room gameplay from a basic timer panel into a clearer card-flow and winner-banner pass.

## Files changed

- `game/private-scene.html`
- `game/modules/private_scene_runtime_phase160.js`
- `docs/PHASE-160-SCORPION-CARD-FLOW-WINNER-BANNER-LOCK.md`
- `update/version.json`

## Added

- Scorpion-only card-flow overlay.
- Large readable player cards.
- Board card display.
- Winner banner.
- Pot progress bar.
- Pot vacuum/chip-line visual.
- Player and bot stacks.
- 20-second action timer.
- Street progression: preflop, flop, turn, river, showdown.
- Left-to-right dealing rule recorded.
- Auto-check / auto-fold / auto-staged call rule display.

## Preserved

- Phase 158 private room runtime.
- Reiki, PGA, Lounge preserved.
- Official root `logo.png` branding.
- No music.
- No watch yet.
- Modular private room structure.

## Test URL

```text
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase160-card-flow
```

## Next phase

Phase 161 should move the card flow from overlay into real table-level 3D card meshes and add action buttons.
