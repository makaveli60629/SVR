# Phase 338 — Bankroll and Chip Inventory Synchronization Lock

## Build
`PHASE-338-BANKROLL-CHIP-INVENTORY-SYNC-LOCK`

## Purpose
Phase 338 makes the player's visible, usable chip inventory equal the Phase 336 authoritative bankroll after every gameplay result.

## Preserved systems
- Phase 332 chip pickup, controller fallback, Meta-hand pinch, gravity, throwing, bounce, stacking, and pass-line commitment.
- Phase 333 Quest-safe materials, lighting, and reachable action controls.
- Phase 334 seated layout, two-column chip/bet arrangement, cards, Eric bots, and gesture poker.
- Phase 335 Oculus sightline and recovery governors.
- Phase 336 authoritative rules, exact stack accounting, side pots, burns, split pots, and payouts.
- Phase 337 physical main-pot, side-pot, blind-marker, and winner-settlement presentation.

## Authoritative visible bankroll
- Reads the human player's exact stack directly from the Phase 336 engine.
- Reuses the existing Phase 332 physical chip pool instead of creating a second interactive chip authority.
- Dynamically assigns denominations of `$1`, `$5`, `$25`, `$100`, `$500`, `$1,000`, and `$5,000`.
- Keeps the visible unlocked-chip total equal to the authoritative player stack.
- Accounts for chips currently held or moving across the felt before rebuilding the stationary bank.
- Keeps a working-change reserve for ordinary calls and raises.
- Uses no more than the existing 32-chip Quest interaction budget.

## Gameplay synchronization
- Bet, call, raise, and all-in reductions rebuild the available bankroll immediately.
- Winner and split-pot awards animate from the pot area toward the bankroll tray.
- Losses animate from the bankroll tray toward the bet/pot area.
- Committed chips are reclaimed only after Phase 337 winner settlement, preventing pot-animation conflicts.
- A busted player shows `$0` and `PLAYER OUT`; chips are not silently restored.
- The next hand and explicit table reset both rebuild the physical inventory from the current authoritative stack.

## Stability
- Phase 334 cannot pull managed bankroll chips back into obsolete stack positions.
- The governor restores stationary chips if another older layout module moves them.
- Legacy left-bank labels are suppressed so only the authoritative bankroll panel remains.
- High bankrolls can be represented exactly through higher-value chips without exceeding Quest mesh limits.

## Runtime helpers
```js
window.SVR_PHASE338_QA()
window.SVR_PHASE338_AUTOMATED_QA()
window.SVR_PHASE338_REBUILD()
window.SVR_PHASE338_BANKROLL_MODEL(2375)
```

## Oculus route
`https://svrpoker.com/game/index.html?v=phase338-bankroll-sync`

## Acceptance sequence
1. Enter VR and confirm the bankroll panel matches the player's stack.
2. Confirm the sum of visible unlocked chips matches the same number.
3. Pick up and throw chips without changing their denomination or bankroll value.
4. Call, raise, and go all-in; confirm the remaining bank rebuilds to the exact stack.
5. Win a hand and confirm award chips travel toward the bank before the inventory refills.
6. Test a split pot and confirm the player's visible inventory matches the awarded share.
7. Lose all chips and confirm the bank becomes empty without an automatic rebuy.
8. Start the next hand and confirm the bankroll remains exact.
9. Run the automated QA and confirm the `$0` through large-bankroll samples pass.

## Protected scope
- Game-side files only.
- Public website untouched.
- Sponsor and partner content untouched.
- Android stable route remains separate.
- APK remains `0.1.0-rc1`, code `1`, with no forced update.
- This phase does not claim server-authoritative multiplayer.
