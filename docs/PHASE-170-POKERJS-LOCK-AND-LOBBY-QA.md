# PHASE-170-POKERJS-LOCK-AND-LOBBY-QA

## Purpose

Phase 170 shifts priority back to playable poker. It adds a modular `game/poker/poker.js` engine and wires the Scorpion private room to use the engine for real hand flow, player actions, bot actions, pot accounting, and winner evaluation.

## Files changed

- `game/poker/poker.js`
- `game/modules/private_scene_runtime_phase170.js`
- `game/private-scene.html`
- `docs/PHASE-170-POKERJS-LOCK-AND-LOBBY-QA.md`
- `update/version.json`

## Added

- Modular poker engine:
  - `createDeck`
  - `shuffle`
  - `evaluateFive`
  - `evaluateSeven`
  - `createPokerGame`
- Locked Texas Hold'em hand flow:
  - Preflop
  - Flop
  - Turn
  - River
  - Showdown
- Player actions:
  - Fold
  - Check
  - Call
  - Raise
  - All-In
  - Next Hand
- Bot actions.
- 20-second timer.
- Auto-check when free.
- Auto-fold when facing bet.
- Winner evaluation.
- Pot accounting.
- Left-to-right dealing from dealer button.
- Runtime records:
  - `window.SVR_PHASE170_LAST_STATE`
  - compatibility mirrors into Phase 160/161 state records for existing visual overlays.

## Preserved

- Phase 166 Scorpion visuals.
- Phase 169 lobby lock remains active for `game/index.html`.
- Official logo branding.
- No music.
- No site changes.
- No teleport changes.
- No movement changes.
- No XR reference-space mutation.

## Test URLs

Lobby:

```text
https://svrpoker.com/game/index.html?v=phase169-lobby-asset-pass
```

Scorpion poker:

```text
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase170-pokerjs-lock
```

## QA checklist

1. Open Scorpion private scene.
2. Confirm Phase 170 HUD appears.
3. Confirm hand starts automatically.
4. Confirm cards are dealt left-to-right.
5. Confirm Check / Call / Raise / All-In / Fold buttons respond.
6. Confirm bot actions advance automatically.
7. Confirm pot increases correctly.
8. Confirm hand reaches showdown.
9. Confirm winner and best hand display.
10. Confirm lobby still loads as Phase 169.

## Next phase

Phase 171 should bind the poker engine more tightly to true 3D table meshes, card positions, chips, and seat indicators.
