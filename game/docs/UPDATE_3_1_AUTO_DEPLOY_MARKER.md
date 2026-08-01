# Phase 349 Auto Deploy Marker

## Build
`PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Presence validation workflow: `.github/workflows/phase349-presence-check.yml`

## Static payload
- `game/modules/phase349_multiplayer_presence_seat_reconnect_lock.js`
- `game/modules/phase349_presence_gameplay_seat_bridge.js`
- `game/modules/phase340_platform_manifest.js`
- `game/index.html`
- `game/android.html`
- `game/manifest.json`
- `game/android-release.json`
- `site/config/player-api.json`
- Phase 349 validation and documentation

## Backend payload
- `backend/phase349/src/server.js`
- `backend/phase349/sql/001_phase349_presence_seat_leases.sql`
- `backend/phase349/package.json`
- `backend/phase349/.env.example`
- `backend/phase349/README.md`

The static deploy does not deploy the Node presence service. Production presence requires a separately approved HTTPS backend deployment and Azure SQL migration.

## Presence locks
- One active presence identity per player per room.
- One owner per seat per room.
- Valid seats: 0–5.
- Sitting claims canonical seat `0`.
- Leaving releases the seat.
- Heartbeats expire stale presence and seat leases.
- Reconnect replaces the old player session.
- Duplicate remote player IDs collapse to the newest heartbeat.
- Camera 3 receives no account/avatar/presence modules.

## Transport truth
- `presenceApiBase` remains empty.
- Current mode is same-browser simulation only.
- Internet multiplayer is not claimed.
- Poker state remains local and is not synchronized by Phase 349.

## Runtime QA
```js
window.SVR_PHASE349_QA()
window.SVR_PHASE349_SEAT_BRIDGE_QA()
window.SVR_PHASE349_STATE()
window.SVR_PHASE349_TRANSPORT()
window.SVR_PHASE349_CLAIM_SEAT(0)
window.SVR_PHASE349_RELEASE_SEAT()
```

## APK release gate
- Current APK: `0.1.0-rc1`, code `1`
- Reserved next APK: `0.1.0-rc2`, code `2`
- Signed native package present: false
- `releaseReady`: false
- APK URL: empty
- Forced update: false
- Automatic update prompt: false
- Manual update only: true
