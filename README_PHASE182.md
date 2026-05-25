# SVR Phase 183 Backend Starter

Build: `PHASE-185-TURN-INDICATOR-WATCH-SYNC-LOCK`

Adds optional persistence for side-pot resolution payloads.

Routes:
- `POST /api/game/side-pots`
- `GET /api/game/side-pots?limit=30`

Run SQL migration:
- `sql/009_phase183_side_pots.sql`

No secrets are included.
