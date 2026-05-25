
# SVR Phase 187 Backend Starter

Build: `PHASE-187-DECISION-AID-POT-ODDS-LOCK`

Adds optional backend persistence for decision-aid / pot-odds telemetry.

Routes:
- `POST /api/game/decision-aid`
- `GET /api/game/decision-aid?limit=30`

Run SQL migration:
- `sql/014_phase187_decision_aid.sql`

No secrets are included. Keep Azure SQL connection strings in App Service settings or `.env` only.
