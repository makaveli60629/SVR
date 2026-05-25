# PHASE-180-SHOWDOWN-WINNING-CARDS-LOCK

Adds optional backend persistence for showdown reveal results.

Apply SQL migration:

```sql
:r sql/007_phase180_showdowns.sql
```

Routes:
- `POST /api/game/showdown`
- `GET /api/game/showdowns?limit=30`

No secrets are included. Keep Azure SQL connection string in App Service settings or local `.env`.
