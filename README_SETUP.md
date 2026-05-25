# SVR Phase 195 Backend / Database Starter

Build: `PHASE-195-BUG-REPORT-CAPTURE-LOCK`

## New endpoint
- `POST /api/game/bug-report`
- `GET /api/game/bug-report?limit=30`

## SQL
Run:

```sql
sql/022_phase195_bug_reports.sql
```

No secrets are included. Keep `AZURE_SQL_CONNECTION_STRING` only in Azure App Service settings or local `.env`.
