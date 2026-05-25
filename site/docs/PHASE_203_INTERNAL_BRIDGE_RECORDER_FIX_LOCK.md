# Phase 203 Internal Bridge Recorder Fix Lock

This site-internal patch documents the runtime game-side fix for the enterprise bridge recorder crash.

Protected:
- Root public Matrix launch page untouched.
- `/game` changes are handled only by the game package.
- No API secrets, SQL passwords, or Stripe keys included.

Game fix:
- `recordDealerButton` method added.
- Dealer button / blind events no longer crash the render loop.
- Rebuy, decision aid, all-in, QA, smoke, release, bug-report, queue, and certification event recorder aliases added.
