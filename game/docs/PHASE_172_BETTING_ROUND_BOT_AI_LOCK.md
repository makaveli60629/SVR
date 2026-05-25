# PHASE-172-BETTING-ROUND-BOT-AI-LOCK

## Scope
Game-side only. Site remains untouched. This phase builds on Phase 171 and focuses on poker betting realism rather than scenery.

## Added
- Street-by-street betting passes for preflop, flop, turn, and river.
- Bot AI decisions based on hand/street strength, call pressure, stack pressure, and small bluff chance.
- Bots can check, bet, call, fold, or raise.
- Closing response pass so bots can respond to player raises and the player can respond to late bot pressure.
- Left-to-right dealing from the dealer button order preserved.
- Watch now displays current target bet, call amount, legal actions, player stack, and recent action.
- Action history is stored in poker state for watch/status display.

## Preserved
- True lobby baseline.
- Website untouched.
- Dealer body remains disabled/invisible.
- Invisible dealing/card logic preserved.
- 5 bot seats plus 1 open south/front player seat.
- Poker action keys and watch actions.
- Reiki approval-safe placeholders.
- Package under 25 MB.

## Test checklist
1. Confirm build label shows `PHASE-172-BETTING-ROUND-BOT-AI-LOCK`.
2. Start a hand and verify blinds post.
3. Confirm cards deal left-to-right from the dealer button order.
4. Verify bots make varied decisions: check, call, bet, fold, raise.
5. Verify the hand pauses when the player is asked to act.
6. Verify F / X / C / R / A / H keys still work.
7. Verify the watch shows legal actions and call amount.
8. Verify showdown pays the pot to the live winner.
