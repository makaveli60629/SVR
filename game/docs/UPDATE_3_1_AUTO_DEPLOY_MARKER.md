# Update 3.1 Auto Deploy Marker

## Status
Phase 335 is prepared for automatic deployment through a merge to `main`.

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`
- Scope: Oculus gameplay stability plus existing clean director-preview QA

## Phase
`PHASE-335-OCULUS-ACCEPTANCE-GAMEPLAY-STABILITY-LOCK`

## Phase 335 payload
- `game/index.html`
- `game/modules/phase335_oculus_acceptance_gameplay_stability_lock.js`
- `game/manifest.json`
- `game/android-release.json`
- `game/docs/PHASE_335_OCULUS_ACCEPTANCE_GAMEPLAY_STABILITY_LOCK.md`
- `docs/phase335_oculus_acceptance_gameplay_stability_lock.md`

## Locked behavior
- Phase 334 professional table, pass line, logo, chips, cards, Eric bots, gestures, and seated calibration remain active.
- Old headset-blocking overlays remain suppressed.
- Chips outside accepted table bounds are recovered.
- Player cards remain visible and headset-facing.
- Duplicate poker actions are debounced.
- QA panel is hidden unless explicitly enabled.

## Locked release policy
- APK version name: `0.1.0-rc1`
- APK version code: `1`
- Forced update: `false`
- Update prompt: `false`
- Stable Android web entry: `/game/android.html?channel=stable`

## Protected scope
- No public-site redesign.
- No sponsor or partner changes.
- No claim of completed networked multiplayer.
