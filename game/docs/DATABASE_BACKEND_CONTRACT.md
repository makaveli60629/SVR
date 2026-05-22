# SVR Database Backend Contract

The game calls a secure API only. SQL credentials stay in backend environment variables.

## Minimum endpoint
GET /api/health

Response shape:
```json
{ "ok": true, "database": "connected", "service": "svr-api" }
```

## Recommended game endpoints
POST /api/game/events
POST /api/poker/sessions
POST /api/poker/hands
GET /api/store/products
GET /api/admin/status

## Recommended tables
- GameSessions
- GameEvents
- PokerHands
- PokerPlayers
- StoreProducts
- AdminStatus
- AdminLogs

## Never commit
- SQL connection string
- Stripe secret key
- JWT secret
- admin passwords
