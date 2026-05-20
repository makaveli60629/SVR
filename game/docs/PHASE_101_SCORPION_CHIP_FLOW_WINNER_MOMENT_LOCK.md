# Phase 101 — Scorpion Chip Flow and Winner Moment Lock

## Goal

Improve Scorpion table feedback so chip movement, pot movement, winner reveal, winning hand display, and hand history feel clearer during seated play.

## Game-side lock

This phase is game-side only.

Protected:

- no website edits
- no SQL/backend edits
- no lobby redesign
- no new rooms
- no sponsor content
- no unapproved Reiki/founder branding
- no heavy asset imports

## Adds

- `game/modules/scorpion_chip_flow_polish.js`
- lightweight chip-flow event listener
- winner moment display support
- hand-history synchronization support
- non-breaking global state:
  - `window.SVR.phase101`
  - `window.SVR_SCORPION_CHIP_FLOW_POLISH`

## Events listened for

- `svr:poker:action`
- `svr:poker:bet`
- `svr:poker:call`
- `svr:poker:raise`
- `svr:poker:pot`
- `svr:poker:pot-sweep`
- `svr:poker:winner`
- `svr:poker:showdown`
- `svr:poker:hand-history`

## Preserve

- left-to-right dealing
- invisible dealer body
- five bots plus one open south/front player seat
- flat chips
- SVR table logo
- pass/bet line
- 20-second timer
- auto-check / auto-fold
- auto-staged call amount
- Quest controller fallback
- watch baseline

## QA

- Scorpion loads without black screen.
- Player can sit at table edge.
- Chips remain flat.
- Pot movement is visible.
- Winner banner is readable.
- Winning hand display is readable.
- Hand history updates without clutter.
- Quest controls remain valid.
