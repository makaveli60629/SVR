# PHASE-179-BETTING-ROUND-CONSISTENCY-LOCK

Adds optional backend persistence for poker legal-action states.

Apply SQL migration:

```sql
:r sql/006_phase179_legal_actions.sql
```

Routes:
- `POST /api/game/legal-actions`
- `GET /api/game/legal-actions?limit=30`

No secrets are included. Keep Azure SQL connection string in App Service settings or local `.env`.
