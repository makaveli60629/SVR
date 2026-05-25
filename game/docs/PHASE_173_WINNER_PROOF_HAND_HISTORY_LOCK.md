# PHASE-173-5-POKER-HISTORY-INIT-BOOT-FIX

## Scope
Game-side only. Website/site files remain untouched.

## Purpose
Convert the Phase 172 betting flow into a clearer tester-facing poker proof loop by showing exactly why a winner won at showdown.

## Added
- Winner proof panel on the table.
- Exact best-five winning-card text.
- Winning-card highlight/emissive boost.
- Hand-history strip with recent completed hands.
- Replay-friendly `winnerProof` and `handHistory` state returned from `pokerDemo.getState()`.
- Watch line shows winner, hand type, and best five after showdown.

## Preserved
- True lobby baseline.
- Dealer body disabled / invisible dealer logic preserved.
- Five bots and one south/front player seat.
- Left-to-right dealing from the dealer-button order.
- Phase 172 betting rounds and bot AI.
- Poker keys: F fold, X check, C call, R raise, A all-in, H next hand.
- Reiki approval placeholder safety.
- Package under 25 MB.

## Test checklist
1. Load `/game/?v=phase173-winner-proof-hand-history-lock`.
2. Confirm visible build label is `PHASE-173-5-POKER-HISTORY-INIT-BOOT-FIX`.
3. Play or wait through one full hand.
4. Confirm showdown shows winner, payout, hand type, best-five cards, board, and reason.
5. Confirm winning cards glow/lift.
6. Confirm hand-history strip receives the completed hand.
7. Confirm watch shows winner proof after showdown.
8. Confirm site/root pages are untouched.
