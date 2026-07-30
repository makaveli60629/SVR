# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: Android game route / Phase 325 controls and table unifier

## Reason
Phase 325 fixes the Android duplicate-stick overlay, reverses the left/right joystick direction that was inverted on Android, loads the missing table authority modules into the Android route, and aligns cards/chips to an Android-ready table surface.

## Current handoff
- `game/android.html`
- `game/phase325_android_controls_table_unifier_lock.js`
- `game/phase324_android_game_entry_controls_lock.js`
- `game/modules/phase323_table_resting_point_alignment_lock.js`

## Notes
No public website files were edited by this marker.
This is a deploy trigger / trace file only.

## Trigger
2026-07-30 Phase 325 Android controls and table unifier deploy trigger.
