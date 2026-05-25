# Site Phase 10 — Internal Showdown Lock

Adds internal `/site` JavaScript hook for showdown reveal telemetry.

Protected:
- Does not touch root public Matrix launch page.
- Does not include SQL strings, Stripe secrets, or passwords.
- Only listens for browser events from the game runtime.

Game build: `PHASE-180-SHOWDOWN-WINNING-CARDS-LOCK`
