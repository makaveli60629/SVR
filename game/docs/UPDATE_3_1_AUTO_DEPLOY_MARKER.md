# Phase 341 Auto Deploy Marker

## Build
`PHASE-341-CANONICAL-TABLE-GEOMETRY-CARD-MOTION-LOCK`

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`

## Payload
- `game/modules/phase341_table_coordinate_model.js`
- `game/modules/phase341_canonical_table_geometry_card_motion_lock.js`
- `game/modules/phase340_platform_manifest.js`
- `game/index.html`
- `game/android.html`
- `game/camera3.html`
- `game/manifest.json`
- `game/android-release.json`
- Phase 341 documentation

## Locked geometry and gameplay
- One uploaded FBX table body.
- One centered logo at 22% of felt width.
- White/gold pass line inset 0.0508 m.
- South/front open player seat.
- Dealer-left-to-right two-round deal.
- One card pool and one Phase 336 action authority.

## Release lock
- APK `0.1.0-rc1`, code `1`
- Force update: false
- Update prompt: false
- Manual update only: true
