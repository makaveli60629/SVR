# Phase 172B — Sponsor Admin Approval Flow Lock

## Objective
Add the admin-facing sponsor approval workflow so sponsors can be reviewed and converted into game-ready JSON without programming.

## Added

### `site/admin-sponsors.html`
Static sponsor admin dashboard.

Features:
- Sponsor queue table
- Filter by all/pending/approved/denied
- Selected sponsor detail panel
- Approve action
- Deny action
- Pause action
- Expire action
- Preview in game action
- Copy game-ready JSON
- Download game-ready JSON
- Sponsor inventory slot map

### `site/data/sponsors/pending-sponsors.json`
Static data source for dashboard testing.

Includes:
- Example Reiki Sponsor
- PGA Training Demo

### `site/sponsor-intake.html`
Updated to link directly to the new admin sponsor dashboard.

### `game/version.json`
Updated to Phase 172B.

## Admin Workflow

1. Sponsor fills out `site/sponsor-intake.html`.
2. Admin opens `site/admin-sponsors.html`.
3. Admin reviews sponsor profile.
4. Admin approves, denies, pauses, or expires sponsor.
5. Admin exports/copies game-ready JSON.
6. Game sponsor loader reads approved JSON and displays sponsor module.

## Current Static Limit
Dashboard actions update the browser session and export JSON. They do not yet write back to the repository or database. Next backend phase should save approved packets to persistent storage.

## Test Links

Sponsor intake:
`/site/sponsor-intake.html`

Sponsor admin:
`/site/admin-sponsors.html`

Game preview:
`/game/?v=phase172b-sponsor-admin`

## Commits
- `a3b148e5d66aec6f11b5e3824bcd60bb7105621e` — Add Phase 172B pending sponsor data.
- `04e39cd8e0873614615edf054e1365cfb74396b7` — Add Phase 172B sponsor admin dashboard.
- `82aa599edeb2e813668ec8ce9f2d43b029236492` — Connect sponsor intake to Phase 172B admin dashboard.
- `7d68b23c31727239c35ac6f94b6a691bbf9c12f0` — Update game version to Phase 172B sponsor admin.
