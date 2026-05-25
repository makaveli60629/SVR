# PHASE-180-SHOWDOWN-WINNING-CARDS-LOCK

Adds optional backend persistence for poker action logs.

Apply SQL migration:

```sql
:r sql/005_phase178_action_log.sql
```

Routes:
- `POST /api/game/action-log`
- `GET /api/game/action-log?limit=30`

No secrets are included. Keep Azure SQL connection string in App Service settings or local `.env`.
