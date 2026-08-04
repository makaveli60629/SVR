# Site Phase 08 — Internal Action Log Lock

Adds internal `/site` JavaScript hook for poker action log telemetry.

Protected:
- Does not touch root public Matrix launch page.
- Does not include SQL strings, Stripe secrets, or passwords.
- Only listens for browser events from the game runtime.

Game build: `PHASE-178-ACTION-LOG-BOT-DECISION-LOCK`
