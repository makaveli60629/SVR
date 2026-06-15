# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: game runtime cleanup / Phase 279 overlay cleanup and Android guard

## Reason
Phase 279 was committed to reduce duplicate overlays, hide duplicate scene markers, guard Android canvas black-screen behavior, and keep the current table interaction stack intact.

## Current handoff
- `docs/phase279_overlay_cleanup_android_guard_manifest.md`
- `game/phase279_overlay_cleanup_android_guard_lock.js`

## Notes
No public website files were edited by this marker.
This is a deploy trigger / trace file only.

## Trigger
2026-06-15 Phase 279 cleanup deploy trigger.
