# Phase 345 — Player Login, Profile, Daily Reward, and API Lock

## Build
`PHASE-345-PLAYER-LOGIN-PROFILE-DAILY-REWARD-API-LOCK`

## Public account behavior
- `site/login.html` now performs real API login and registration when `site/config/player-api.json` contains a deployed `apiBase`.
- `site/register.html` routes to the functional account page instead of saving a fake registration record.
- `site/profile.html` displays player identity, play-money balance, streak, activity progress, reward status, avatar URL, and game links.
- Account sessions use cookies with `credentials: include`; no production access token or password is stored in local storage.
- When the API is not configured, a clearly labeled local demo profile is available for interface testing.

## Game activity bridge
The account bridge loads on Android, Quest, and desktop playable routes, but not Camera 3.

Authenticated play:
1. Starts a game activity session.
2. Sends one heartbeat per minute while the page is visible.
3. Includes platform, route, hand phase, hand number, and seated state as metadata.
4. Ends the activity session during page exit when possible.

## Daily reward
Default production rule:
- 300 verified active seconds during the current UTC day.
- At least three accepted heartbeats.
- No prior claim for that UTC day.
- Reward: 5,000 play-money chips.

Production reward claims are enforced by Azure SQL using a serializable transaction and a unique `(PlayerId, RewardDate)` constraint.

## Secure backend
Location: `backend/phase345/`

Endpoints:
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

## Database tables
- `Players`
- `PlayerCredentials`
- `PlayerInventory`
- `GameSessions`
- `DailyRewardClaims`
- `PlayerActivityEvents`

## Runtime QA
```js
window.SVR_PLAYER_ACCOUNT.snapshot()
window.SVR_PHASE345_ACCOUNT_QA()
window.SVR_PHASE345_START_SESSION()
window.SVR_PHASE345_HEARTBEAT()
window.SVR_PHASE345_END_SESSION()
window.SVR_PHASE345_DEMO_ACTIVITY.read()
```

## Deployment truth
Merging this phase deploys the static account pages and game bridge through GitHub Pages. It does not create Azure infrastructure, run the SQL migration, or populate production records. Production database writes begin only after:
1. The SQL migration is executed.
2. The Node backend is deployed.
3. Backend environment variables are configured securely.
4. `site/config/player-api.json` receives the approved HTTPS API base URL.

## Protected locks
- Phase 336 remains poker-ledger authority.
- Phase 341 remains table/card geometry authority.
- Phase 342 remains performance authority.
- Phase 343 remains Android HUD authority.
- Phase 344 remains Android action/acceptance authority.
- APK remains `0.1.0-rc1`, code `1`.
- Forced and recurring APK update prompts remain disabled.
