# SVR Phase 194 Backend / Database Starter

Build: `PHASE-194-PLAYTEST-WIZARD-LOCK`

## New endpoint
- `POST /api/game/playtest-wizard`
- `GET /api/game/playtest-wizard?limit=30`

## SQL
Run:

```sql
sql/021_phase194_playtest_wizard.sql
```

No secrets are included. Keep `AZURE_SQL_CONNECTION_STRING` only in Azure App Service settings or local `.env`.
