# Phase 349 — Multiplayer Presence, Seat Ownership, and Reconnect Recovery

Build: `PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK`

Phase 349 creates the first multiplayer-ready authority boundary without claiming full networked poker.

## Synchronized now

- unique player identity
- room presence
- client/session identity
- display name and avatar summary
- standing/seated pose
- seat lease
- heartbeat
- disconnect expiry
- reconnect replacement
- duplicate-player suppression

## Not synchronized yet

- deck and hole cards
- community-card authority
- bets and balances
- player turns
- pots and side pots
- showdown and winners

Those remain local Phase 336 state until a later server-authoritative table-state phase.

## Current mode

`presenceApiBase` is intentionally blank. The game therefore uses a clearly labeled same-browser simulation based on `BroadcastChannel` and short local leases. Production internet presence begins only after `backend/phase349` and its Azure SQL migration are deployed and the HTTPS service URL is configured.

## Acceptance

- one player per room identity
- one owner per seat
- seats 0–5 only
- stale lease cleanup
- reconnect replaces old session
- Camera 3 exclusion
- Android/Quest/PC proxy budgets
- no forced APK update
