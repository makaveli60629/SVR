# PHASE-164-SCORPION-ACTION-STATE-HAND-HISTORY-STRIP-LOCK

## Purpose

Phase 164 adds action-state records and a visible hand history strip for the Scorpion private room. It is an audit-safe gameplay telemetry layer and does not change locomotion, teleport, hand tracking, WebXR dolly movement, or XR reference spaces.

## Files changed

- `game/private-scene.html`
- `game/modules/private_scene_runtime_phase164.js`
- `docs/PHASE-164-SCORPION-ACTION-STATE-HAND-HISTORY-STRIP-LOCK.md`
- `update/version.json`

## Added

- Hand history strip.
- Action-state panel.
- Top compact history pills.
- Records Phase 161 table action state.
- Records Phase 160 winner state.
- Records Phase 163 watch action mirror state.
- Exposes audit records:
  - `window.SVR_PHASE164_HAND_HISTORY`
  - `window.SVR_PHASE164_LAST_ACTION_STATE`
  - `window.SVR_PHASE164_LAST_WINNER_RECORD`
  - `window.SVR_PHASE164_LAST_WATCH_ACTION_RECORD`

## Preserved

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
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase164-history-strip
```

## Next phase

Phase 165 should add 3D pot vacuum and stronger winning-hand display visuals without changing movement or teleport.
