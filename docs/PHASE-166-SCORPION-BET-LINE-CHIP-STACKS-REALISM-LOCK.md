# PHASE-166-SCORPION-BET-LINE-CHIP-STACKS-REALISM-LOCK

## Purpose

Phase 166 adds a Scorpion pass/bet line and flatter, more realistic chip stack visuals. This is a display-only visual layer and does not change locomotion, teleport, hand tracking, WebXR dolly movement, or XR reference spaces.

## Files changed

- `game/private-scene.html`
- `game/modules/private_scene_runtime_phase166.js`
- `docs/PHASE-166-SCORPION-BET-LINE-CHIP-STACKS-REALISM-LOCK.md`
- `update/version.json`

## Added

- Pass / bet line visual.
- Player stack zone.
- Bot stack zone.
- Flat chip stack visuals.
- Multi-color chip piles.
- Pot/stack state panel.
- `window.SVR_PHASE166_LAST_CHIP_STATE` audit record.

## Preserved

- Phase 165 pot vacuum / winner display.
- Phase 164 hand history strip.
- Phase 163 watch action mirror.
- Phase 162 turn indicators.
- Phase 161 table/action layer.
- Official `logo.png` branding.
- No music.
- No teleport changes.
- No movement changes.
- No hand tracking changes.
- No XR reference-space mutation.

## Test URL

```text
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase166-bet-line-chips
```

## Next phase

Phase 167 should polish player action prompts and button readability without changing movement or teleport.
