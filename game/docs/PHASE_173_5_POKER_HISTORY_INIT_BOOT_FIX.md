# Phase 173.5 — Poker History Init Boot Fix

## Purpose
Fixes the boot-blocking poker module runtime error:

```text
ReferenceError: Cannot access 'handHistory' before initialization
```

## Root cause
`paintHistoryPanel()` was called during `createPokerDemo()` before the `const handHistory = []` declaration was initialized. Browser ES module execution correctly treats this as a temporal-dead-zone error.

## Fix
Moved the poker runtime state declarations, including `handHistory`, above the initial `paintProofPanel()` / `paintHistoryPanel()` calls.

## Preserved
- Phase 173 winner proof and hand history UI
- Phase 172 betting/bot AI flow
- Phase 173.4 skyline and Legend Hall boot hotfixes
- Dealer body disabled
- Left-to-right dealing
- Site untouched
- Package under 25 MB
