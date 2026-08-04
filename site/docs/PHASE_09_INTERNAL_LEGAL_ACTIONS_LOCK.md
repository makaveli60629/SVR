# Site Phase 09 — Internal Legal Actions Lock

Adds internal `/site` JavaScript hook for legal poker action telemetry.

Protected:
- Does not touch root public Matrix launch page.
- Does not include SQL strings, Stripe secrets, or passwords.
- Only listens for browser events from the game runtime.

Game build: `PHASE-179-BETTING-ROUND-CONSISTENCY-LOCK`
