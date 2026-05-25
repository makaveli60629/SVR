# SVR Phase 186 Backend Starter

Build: `PHASE-187-DECISION-AID-POT-ODDS-LOCK`

Adds optional storage for dealer button / blind-state snapshots and rebuy continuity events.

Run SQL migration:

```sql
sql/013_phase186_dealer_rebuy.sql
```

No secrets are included. Keep Azure SQL connection strings in App Service configuration or local `.env`, never in frontend files.
