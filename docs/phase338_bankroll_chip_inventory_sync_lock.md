# Phase 338 — Bankroll and Chip Inventory Synchronization Lock

## Result
Phase 338 links the player's physical, visible chip bank to the exact Phase 336 authoritative stack.

### Locked improvements
- Existing Phase 332 interactive chips remain the sole physical player-chip authority.
- Visible unlocked-chip value equals the authoritative bankroll.
- Held and thrown chips remain part of the bankroll until committed.
- Bets and losses reduce the physical bank immediately.
- Main-pot and side-pot awards refill the bank after Phase 337 settlement.
- Split-pot awards use the exact authoritative player share.
- Busted players remain at `$0` with no silent rebuy.
- Denominations scale from `$1` through `$5,000` within the existing 32-chip Quest budget.
- The left bankroll display reports both ledger value and visible-chip value.
- Deterministic tests cover small change, starting stacks, large winner stacks, and chip-count limits.

## Test route
`https://svrpoker.com/game/index.html?v=phase338-bankroll-sync`

## Runtime QA
```js
window.SVR_PHASE338_QA()
window.SVR_PHASE338_AUTOMATED_QA()
window.SVR_PHASE338_REBUILD()
window.SVR_PHASE338_BANKROLL_MODEL(6000)
```

## Release policy
- APK: `0.1.0-rc1`
- Version code: `1`
- Forced update: `false`
- Public website untouched.
- No claim of completed server-authoritative multiplayer.
