# Site Internal Phase 24 — Playtest Wizard Lock

Build: `PHASE-194-PLAYTEST-WIZARD-LOCK`

## Scope
- Adds `/site/js/playtest-wizard-client.js`.
- Internal API client only.
- Does not touch root `index.html`, Matrix rain, public page CSS, or `/game`.

## API
- `POST /api/game/playtest-wizard`
- `GET /api/game/playtest-wizard?limit=30`
