# Phase 349 Presence API

Build: `PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK`

This service adds authenticated player presence and seat leases. It does not synchronize poker cards, balances, turns, or pots.

## Deployment order

1. Deploy the Phase 345 account API and run its SQL migration.
2. Run `sql/001_phase349_presence_seat_leases.sql` against the same Azure SQL database.
3. Configure the same `PLAYER_JWT_SECRET`, session cookie name/domain, SQL connection, and allowed site origins.
4. Install dependencies with `npm ci` or `npm install`.
5. Run `npm run check` and `npm start`.
6. Set `presenceApiBase` in `/site/config/player-api.json` to the approved HTTPS service origin, without a trailing slash.

## Endpoints

- `GET /api/health`
- `POST /api/presence/join`
- `POST /api/presence/heartbeat`
- `GET /api/presence/room/:roomId`
- `POST /api/presence/seat/claim`
- `POST /api/presence/seat/release`
- `POST /api/presence/leave`

All presence routes require the Phase 345 signed player session cookie or compatible bearer token.

## Authority rules

- One active presence record per player per room.
- One owner per seat per room.
- Six valid poker seats: `0` through `5`.
- Seat and presence leases expire automatically.
- Rejoining with the same player replaces the prior room session.
- Expired and duplicate presence entries are cleaned during heartbeat/list/seat operations.
- Presence data is cosmetic and positional only.

## Security

Do not commit SQL credentials, JWT secrets, signing keys, cookie secrets, or production environment files. Use secure host configuration.
