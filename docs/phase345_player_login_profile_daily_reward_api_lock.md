# Phase 345 — Player Login, Profile, Daily Reward, and API Lock

## Build
`PHASE-345-PLAYER-LOGIN-PROFILE-DAILY-REWARD-API-LOCK`

Phase 345 replaces the static login/profile placeholders with a shared account client and a deployable secure backend contract.

## Website
- Functional login and registration forms.
- Clearly labeled local demo mode while the production API is unconfigured.
- Live profile page for play money, streak, activity progress, daily reward, avatar URL, and game links.
- Existing registration links now route to the functional account flow.

## Game
- Android, Quest, and desktop routes start account activity sessions for signed-in players.
- One heartbeat is sent per minute while the game is visible.
- Camera 3 does not create player sessions.
- Activity metadata includes platform, route, poker street, hand number, and seated state.

## Backend
`backend/phase345/` contains:
- Node/Express API
- Azure SQL schema
- secure environment template
- deployment guide
- validation workflow

## Daily reward
- 5,000 play-money chips
- 300 active seconds
- at least three accepted heartbeats
- one claim per UTC day
- serializable SQL transaction and unique player/date constraint

## Deployment boundary
GitHub Pages can publish the account UI and game bridge. It cannot deploy the Node backend or migrate Azure SQL. Production database population remains disabled until the backend is separately deployed and `site/config/player-api.json` is configured with its approved HTTPS `/api` URL.

## APK lock
The Android APK remains `0.1.0-rc1`, version code `1`, with forced and recurring update prompts disabled.
