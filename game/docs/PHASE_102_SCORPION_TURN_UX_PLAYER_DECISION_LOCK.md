# Phase 102 — Scorpion Turn UX + Player Decision Lock

## Goal

Improve player-turn clarity in the Scorpion Room without changing the locked poker rules, lobby, website, SQL/backend, sponsor state, or Quest control baseline.

## Adds

- `game/modules/scorpion_turn_ux_polish.js`
- Clear `YOUR TURN — 20` panel
- Legal action display
- Pot / stack / call / minimum raise readout
- Five-second warning state
- Auto-check / auto-fold feedback
- Lightweight active-seat glow hook

## Locked behavior preserved

- Cards deal left-to-right from the dealer button.
- Dealer body remains removed/invisible.
- Five bots plus one open south/front player seat remain.
- 20-second action timer remains.
- Auto-check when legal remains.
- Auto-fold when facing a bet remains.
- Auto-staged call amount remains.
- Raise panel remains only for adding more.
- Chips remain flat.
- SVR table logo remains centered.
- Pass/bet line remains visible.
- Quest/Oculus controller fallback remains.
- Watch remains visible and usable.

## Event hooks

The module listens for:

- `svr:poker:turn`
- `svr:poker:timer`
- `svr:poker:action-state`
- `svr:poker:action`
- `svr:poker:auto-check`
- `svr:poker:auto-fold`

It exposes:

```js
window.SVR_PHASE_102_TURN_UX
window.SVR.scorpionTurnUX
```

## Validation

- Scorpion loads.
- Player can sit at table edge.
- Player turn is clearly visible.
- Timer is readable in desktop and VR preview.
- Legal actions display correctly.
- Auto-check and auto-fold feedback appear.
- Prompts do not block card visibility.
- No website files changed.
- No SQL/backend files changed.
