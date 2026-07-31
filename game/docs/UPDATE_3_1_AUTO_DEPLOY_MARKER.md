# Update 3.1 Auto Deploy Marker

## Status
Phase 334 is prepared on a dedicated GitHub branch. Auto Deploy will trigger only after the Phase 334 pull request is merged into `main`.

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`
- Scope: Quest/Oculus poker-table layout, cards, chips, bots, seat calibration, and gesture gameplay

## Phase
`PHASE-334-TABLE-LAYOUT-GESTURE-POKER-LOCK`

## Phase 334 payload
- `game/index.html`
- `game/modules/phase334_table_layout_gesture_poker_lock.js`
- `game/manifest.json`
- `game/android-release.json`
- `game/docs/PHASE_334_TABLE_LAYOUT_GESTURE_POKER_LOCK.md`
- `docs/phase334_table_layout_gesture_poker_lock.md`

## Preserved systems
- Existing uploaded table authority
- Phase 332 chip geometry, gravity, bounce, and physical betting
- Phase 333 material/shader polish and action authority
- Android stable route
- APK `0.1.0-rc1`, code `1`
- `forceUpdate: false`
- `showUpdatePrompt: false`

## Protected scope
- Public website untouched
- Sponsor/partner content untouched
- No native APK rebuild
- No network multiplayer claim
