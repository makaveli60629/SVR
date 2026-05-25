# Phase 200 — Pilot Testing Ready Lock

Build: `PHASE-238-HAND-TELEPORT-PINCH-DESTINATION-LOCK`

## Protected rules

- Public Matrix launch page is not touched.
- Game deploy stays direct `/game` folder first.
- `update/game.zip` is kept only as a backup/update artifact.
- Dealer body remains disabled; invisible card/deal logic remains preserved.
- Unapproved wellness/founder branding remains removed.

## Added

- `game/modules/pilot_testing_ready.js`
- `window.SVR_PILOT_TESTING_READY`
- `P` keyboard shortcut for the pilot-testing-ready overlay.
- Backend starter endpoint: `/api/game/pilot-ready`
- SQL migration: `sql/027_phase200_pilot_ready.sql`

## Tester flow

1. Open `/game/?v=phase200`.
2. Press `V` for deploy verifier.
3. Press `T` for smoke test.
4. Press `U` for release candidate checklist.
5. Press `W` for guided playtest wizard.
6. Press `Z` for demo certification.
7. Press `P` for the final pilot testing ready gate.
8. Export JSON for the test record.
