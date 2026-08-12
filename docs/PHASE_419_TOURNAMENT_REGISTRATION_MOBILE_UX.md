# Phase 419 — Tournament Registration + Mobile Table UX Lock

Build: `PHASE-419-TOURNAMENT-REGISTRATION-MOBILE-UX-LOCK`

## Scope

Phase 419 responds to physical Android table feedback and adds a play-money tournament registration basis without changing protected poker rules, Quest gameplay, or APK policy.

## Mobile table presentation

The legacy `LEFT → RIGHT` action rail could still read as if it were sitting across the upper opponent row in physical phone screenshots.

Phase 419 adds a second presentation guard:

- `phase419_mobile_table_flow_polish.js`
- `phase419_mobile_table_flow_polish.css`

The legacy flow rail is moved into a dedicated compact `TABLE FLOW` host inside the post-table decision/raise area.

The host explicitly verifies that the rail is not inside:

- `.table-wrap`
- `.table-surface`
- `.players`

The poker state is not modified.

## Tournament registration page

New route:

`/game/tournament-signup.html?v=phase419`

The page shows:

- next five-hour tournament countdown
- local start time
- slot id
- player-name sign-up
- human test roster
- registration timestamp for each human tester
- start-notification permission control

Bot-filled tournament seats are not shown as human sign-ups.

## Five-hour schedule

The schedule remains exact:

`5 * 60 * 60 * 1000 = 18,000,000 ms`

The existing Phase 411 100-player local tournament simulation remains the tournament/table-rotation authority.

## Registration backend truth

Config:

`game/config/tournament-api.json`

Current production truth:

- `apiBase`: blank
- shared registration backend: false
- background push: false

Until a real HTTPS registration API is deployed, the roster uses a device-local fallback. This makes mobile testing usable now without falsely claiming cross-device registration.

## Start notifications

The Phase 419 page can request browser notification permission and can show:

- an in-app tournament-start banner
- an OS notification through the active service worker when supported

Both service workers include a `notificationclick` handler that focuses an existing SVR page or opens the tournament lobby.

Guaranteed notification after the application/browser has been fully closed still requires a production push backend. Phase 419 does not claim that backend is live.

## Admin database preparation

User request: owner username `admin` with a simple initial password.

Security boundary:

- no plaintext owner password is committed to GitHub
- `api/phase419-admin-db-bootstrap.js` creates the database owner row only when explicitly run against the configured PostgreSQL database
- username defaults to `admin`
- temporary password comes from private `ADMIN_INITIAL_PASSWORD`
- production bootstrap refuses temporary passwords shorter than 12 characters
- the stored database value is a bcrypt-style pgcrypto hash
- `must_change_password` is true

Migration:

`api/sql/phase419_admin_tournament_registration.sql`

Bootstrap command after private database/environment configuration:

`npm run bootstrap:admin`

Creating the script/migration in GitHub does not itself prove that the cloud database row exists. The bootstrap must be executed against the authorized database before the account can be called live.

## Protected authorities

Unchanged:

- Phase 403 poker engine
- Phase 403 side-pot engine
- Phase 398 raise rules
- Phase 402 visual/physical order `[0,5,1,2,3,4]`
- Phase 404 ALL IN capture safety
- Phase 414 human-turn rotation authority
- Quest Phase 396
- APK `0.1.0-rc2`, code `2`, manual-update only
- exactly one mobile burn pile

## Multiplayer / voice truth

Phase 419 does not turn local guest placeholders into remote players.

- production match server: not claimed live
- remote multiplayer: not claimed live
- remote voice: not claimed live
- shared tournament registration: not claimed live

These move to live status only after a real secure backend passes production verification.
