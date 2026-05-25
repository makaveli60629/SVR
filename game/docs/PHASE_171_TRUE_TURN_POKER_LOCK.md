# Phase 171 — True Turn Poker Lock

## Scope
Game-side only. Website/site files remain untouched.

## Locked changes
- Converted poker action layer from manual test-only into turn-gated flow.
- Player turn now pauses the scheduled hand on preflop, flop, turn, and river.
- Legal actions are exposed to desktop HUD/watch state.
- 20-second turn timer added. Auto-check when check is legal; auto-fold when facing a call amount.
- Basic chip accounting added: blinds, bot bets, player calls/raises/all-ins, and winner payout.
- Fold/check/call/raise/all-in actions only apply on the player turn.
- Watch display now shows poker stage, pot, stack, and legal actions.

## Preserved locks
- Site untouched.
- True lobby baseline preserved.
- Dealer body remains removed/invisible.
- Invisible card/deal logic preserved.
- Five bots plus one south/front player seat preserved.
- Left-to-right card dealing preserved.
- Reiki approval placeholders preserved.
- Package must stay under 25 MB.

## Test checklist
1. Load `/game/?v=phase171-true-turn-poker-lock`.
2. Confirm build label shows `PHASE-171-TRUE-TURN-POKER-LOCK`.
3. Wait for `YOUR TURN` prompt.
4. Press `X`/`C`/`R`/`F`/`A` only during prompt and confirm pot/stack updates.
5. Let timer expire and confirm auto-check or auto-fold.
6. Confirm showdown payout and next hand cycle.
