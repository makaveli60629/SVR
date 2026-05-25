# SVR Phase 185 Backend Starter

Adds turn-indicator persistence and fixes the Phase 184 bot-safety route implementation to use the shared Azure SQL pool.

## Added
- `POST /api/game/turn-indicator`
- `GET /api/game/turn-indicators?limit=30`
- `sql/012_phase185_turn_indicators.sql`

No secrets are included. Keep SQL and Stripe keys only in Azure App Service settings or `.env`.
