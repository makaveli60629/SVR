# Phase 349 — Multiplayer Presence, Seat Ownership, and Reconnect Recovery Lock

## Build
`PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK`

## Delivered authority

Phase 349 synchronizes player presence and seat ownership only:

- player ID
- display name
- client/session ID
- platform
- avatar summary
- position and facing
- seated/standing state
- seat claim
- heartbeat and expiry
- disconnect and reconnect

It does **not** synchronize poker cards, deck state, balances, bets, turns, pots, winners, or hand progression. Phase 336 remains local poker authority.

## Current transport modes

### Local simulation

Used when `presenceApiBase` is empty.

- `BroadcastChannel` provides immediate same-browser/profile updates.
- `localStorage` preserves a short room lease across tabs.
- Entries expire after 12 seconds without a heartbeat.
- Newest presence per player wins.
- The runtime labels this mode `same-browser simulation`.
- This is not internet multiplayer.

### Authenticated API presence

Prepared in `backend/phase349`.

- Uses the Phase 345 signed player session cookie.
- Uses Azure SQL transactions.
- One presence row per player per room.
- One owner per seat per room.
- Six seats: 0–5.
- Expired presence and seat leases are cleaned automatically.
- Rejoining replaces the prior active room session.

## Game behavior

- Phase 349 loads after Phase 348 local avatar presence.
- Sitting claims canonical Phase 341 seat `0`.
- Leaving releases the seat.
- A conflicting claim produces `SEAT_OCCUPIED` instead of a duplicate owner.
- Remote players use lightweight proxy avatars to stay inside Android/Quest budgets.
- Remote proxies interpolate position and facing.
- Duplicate remote player IDs are collapsed to the newest heartbeat.
- Stale players are removed.
- Camera 3 loads no account, avatar, or presence modules.

## Runtime QA

```js
window.SVR_PHASE349_QA()
window.SVR_PHASE349_SEAT_BRIDGE_QA()
window.SVR_PHASE349_STATE()
window.SVR_PHASE349_TRANSPORT()
window.SVR_PHASE349_REFRESH()
window.SVR_PHASE349_CLAIM_SEAT(0)
window.SVR_PHASE349_RELEASE_SEAT()
window.SVR_PHASE349_LEAVE()
```

## Production deployment

1. Deploy Phase 345 account API.
2. Run `backend/phase349/sql/001_phase349_presence_seat_leases.sql`.
3. Deploy `backend/phase349` with the same JWT/cookie and SQL settings.
4. Set `presenceApiBase` in `/site/config/player-api.json`.
5. Verify two authenticated devices can join one room.
6. Verify simultaneous claims for one seat result in one success and one `409 SEAT_OCCUPIED`.
7. Verify disconnect expiry and reconnect replacement.

## Protected locks

- Phase 336 local poker engine remains unchanged.
- Phase 341 canonical table seat coordinates remain unchanged.
- Phase 347 Android controller and gameplay UI remain unchanged.
- Phase 348 local player avatar remains unchanged.
- Camera 3 stays lightweight and spectator-only.
- APK remains `0.1.0-rc1`, code `1`.
- Forced updates and recurring prompts remain disabled.
