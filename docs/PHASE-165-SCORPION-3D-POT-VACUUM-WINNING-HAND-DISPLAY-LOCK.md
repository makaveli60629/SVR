# PHASE-165-SCORPION-3D-POT-VACUUM-WINNING-HAND-DISPLAY-LOCK

## Purpose

Phase 165 adds a stronger Scorpion winner display and 3D-style pot vacuum visual layer. It remains display-only and does not change locomotion, teleport, hand tracking, WebXR dolly movement, or XR reference spaces.

## Files changed

- `game/private-scene.html`
- `game/modules/private_scene_runtime_phase165.js`
- `docs/PHASE-165-SCORPION-3D-POT-VACUUM-WINNING-HAND-DISPLAY-LOCK.md`
- `update/version.json`

## Added

- Winner banner layer.
- Winning-hand display strip.
- 3D-style animated chip/pot vacuum lane.
- Pot destination changes toward player or bot based on winner.
- Scorpion visual state panel.
- `window.SVR_PHASE165_LAST_POT_VACUUM` audit record.

## Preserved

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
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase165-pot-vacuum
```

## Next phase

Phase 166 should add bet line and flatter, more realistic chip stack visuals.
