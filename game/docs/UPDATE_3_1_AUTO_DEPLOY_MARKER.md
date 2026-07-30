# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: Android game route / Phase 326 playable polish

## Reason
Phase 326 makes Android the temporary primary play path. It removes duplicate Android control overlays, keeps one active control set, fixes left/right movement and look direction, adds smoother lobby lighting, keeps the table visible, adds sit/lobby/center positioning, shows player-facing card display, adds a turn banner, highlights playable buttons, and adds a raise amount slider.

## Current handoff
- `game/android.html`
- `game/phase326_android_playable_polish_lock.js`
- `game/phase325_android_controls_table_unifier_lock.js`
- `game/modules/phase323_table_resting_point_alignment_lock.js`

## Notes
No public website files were edited by this marker.
This is a deploy trigger / trace file only.

## Trigger
2026-07-30 Phase 326 Android playable polish deploy trigger.
