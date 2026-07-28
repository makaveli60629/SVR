# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: game runtime visible hands, orbit sky, and face-box cleanup / Phase 281

## Reason
Phase 281 was committed to force visible Oculus controller hand proxies, add a close high-detail orbiting Moon/Mars sky group above the lobby, and clean dark fixed overlay/face-box elements that may appear in front of the camera.

## Current handoff
- `game/phase281_visible_hands_sky_cleanup_lock.js`
- `game/phase277_status_marker_lock.js` chains Phase 281 after the current loaded cleanup chain.

## Notes
No public website files were edited by this marker.
This is a deploy trigger / trace file only.

## Trigger
2026-06-15 Phase 281 visible hands sky cleanup deploy trigger.
