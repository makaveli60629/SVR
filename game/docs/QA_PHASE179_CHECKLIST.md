# Phase 179 QA Checklist

1. Open `/game/?v=phase179`.
2. Confirm build pill shows `PHASE-179-BETTING-ROUND-CONSISTENCY-LOCK`.
3. Wait for player turn and confirm table panel shows `LEGAL ACTIONS`.
4. Preflop should show call amount.
5. Flop/turn free actions should show check free.
6. Press C/R/A/F and confirm only legal action is resolved.
7. Let timer expire: free action auto-checks, call-facing action auto-folds.
8. Confirm public root page is unchanged.
