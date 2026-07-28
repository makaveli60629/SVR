# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: current game boot / Phase 323 table resting point alignment

## Reason
Phase 323 was committed directly into the current `game/index.html` boot chain. It hides the older floating card/chip roots and rebuilds table cards, pot, and chip stacks at a calculated resting surface so they sit on the table instead of floating in the air. It also loads the visible-hand cleanup from the active Phase 322/323 boot path instead of relying on the older Phase 277 chain.

## Current handoff
- `game/index.html`
- `game/modules/phase323_table_resting_point_alignment_lock.js`
- `game/phase281_visible_hands_sky_cleanup_lock.js`

## Notes
No public website files were edited by this marker.
This is a deploy trigger / trace file only.

## Trigger
2026-06-15 Phase 323 table resting point alignment deploy trigger.
