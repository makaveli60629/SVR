# Phase 87 — Scorpion Table Rules Engine Lock

## Scope

Game-side only. No website, site, SQL, or backend edits.

## Goal

Add the final Scorpion table rules-engine scaffold that connects the table lifecycle, legal action state, bot decision state, hand result evaluation, table accounting, action history, and winner display events.

## Added modules

- `game/modules/table_rules_engine.js`
- `game/modules/hand_result_evaluator.js`
- `game/modules/bot_decision_state.js`
- `game/modules/table_accounting.js`
- `game/modules/table_action_history.js`

## Hard locks

- Preserve left-to-right deal direction.
- Preserve invisible dealer logic.
- Preserve five bots and one open south/front player seat.
- Preserve watch/controller/Quest controls.
- Keep package under 25 MB.
- Do not touch website files.
- Do not add unapproved branding.

## Validation

- Start a clean table round.
- Confirm table state advances.
- Confirm only legal user actions are made available by connected UI layers.
- Confirm bot decisions do not produce impossible moves.
- Confirm final result display events fire.
- Confirm stack and pot totals update.
- Confirm Phase 84/85/86 hooks still work.
