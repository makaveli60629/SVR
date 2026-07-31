# SVR Poker Phase 345 Player Account API

Build: `PHASE-345-PLAYER-LOGIN-PROFILE-DAILY-REWARD-API-LOCK`

## Purpose

Secure backend for:

- player registration and login
- HTTP-only session cookies
- player profiles and play-money balances
- game activity sessions and heartbeats
- once-per-UTC-day 5,000-chip rewards
- future avatar and inventory records

The GitHub Pages frontend never receives the Azure SQL connection string, JWT secret, or password hashes.

## Deploy order

1. Run `sql/001_phase345_player_accounts.sql` against the SVR Azure SQL database.
2. Create an Azure App Service running Node 20 or newer.
3. Set every value from `.env.example` in App Service Configuration. Do not commit production values.
4. Run `npm install` and `npm run check`.
5. Deploy this folder and verify `GET /api/health` returns `status: ok` and `database: connected`.
6. Map the backend to `api.svrpoker.com` or another approved HTTPS hostname.
7. Set `site/config/player-api.json` → `apiBase` to the deployed URL ending in `/api`.
8. Test registration, login, profile update, session start, heartbeat, reward status, reward claim, and logout.

## Security locks

- Passwords are hashed with bcrypt cost 12.
- Authentication uses a signed seven-day JWT in an HTTP-only cookie.
- Mutation requests require an allowed Origin and `X-SVR-Client` header.
- CORS is restricted to configured origins.
- Authentication and API actions are rate limited.
- SQL values are parameterized.
- Daily reward claims use a serializable transaction and a unique `(PlayerId, RewardDate)` constraint.
- Activity heartbeats count at most 75 seconds each, preventing a client from claiming hours in one request.

## Reward rule

Default eligibility:

- 300 accumulated active seconds during the current UTC day
- at least three accepted heartbeats
- no prior claim for the current UTC day

Default reward: `5,000` play-money chips.

## API surface

```text
GET  /api/health
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/player/profile
PUT  /api/player/profile
POST /api/game/session/start
POST /api/game/session/heartbeat
POST /api/game/session/end
GET  /api/rewards/daily/status
POST /api/rewards/daily/claim
```

## Current deployment state

The code and schema are deployable, but merging this folder to GitHub Pages does not create Azure infrastructure or run the SQL migration. Until the backend is deployed and `apiBase` is configured, the public account client stays in clearly labeled local demo mode and performs no production database writes.
