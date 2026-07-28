# Update 3.1 Auto Deploy Marker

## Status
Auto deploy requested and triggered by repo push.

## Deploy target
- Branch: `main`
- Workflow: `.github/workflows/deploy.yml`
- Scope: game runtime controller hand visibility / Phase 280

## Reason
Phase 280 was committed to show Oculus controller hand proxies when Quest controllers are active and real hand tracking is not active. This helps table interaction and object picking while the user is standing at the poker table with controllers.

## Current handoff
- `game/phase280_oculus_controller_hand_proxy_lock.js`
- `game/phase277_status_marker_lock.js` chains Phase 280 after the current loaded cleanup chain.

## Notes
No public website files were edited by this marker.
This is a deploy trigger / trace file only.

## Trigger
2026-06-15 Phase 280 Oculus controller hand visibility deploy trigger.
