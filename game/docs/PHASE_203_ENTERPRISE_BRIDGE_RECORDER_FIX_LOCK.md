# PHASE-213-BOOT-ROUTE-RECOVERY-LINK-LOCK

## Fix
- Fixes runtime error: `this.recordDealerButton is not a function`.
- Adds missing enterprise bridge recorder methods for dealer button, rebuy, decision aid, all-in, fold eligibility, QA, smoke test, release candidate, session export, bug report, tester feedback, queue, bundle, demo certification, and pilot readiness events.
- Keeps boot fallback from Phase 202.
- Public Matrix launch page untouched.

## Test
1. Open `/game/?v=phase206-recordfix`.
2. Confirm the scene does not freeze after dealer button/blind telemetry publishes.
3. Press `V`, `T`, `U`, `W`, `G`, `J`, `K`, `B`, `Z`, `P` to verify diagnostic overlays still load.
