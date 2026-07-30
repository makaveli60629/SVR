# Update 3.1 Auto Deploy Marker

## Status
Phase 330 update prepared on a dedicated branch. Auto Deploy will trigger when the Phase 330 pull request is merged to `main`.

## Deploy target
- Branch trigger: `main`
- Workflow: `.github/workflows/deploy.yml`
- Workflow events: push to `main` and manual `workflow_dispatch`
- Scope: Android stable route plus clean director-preview QA

## Phase
`PHASE-330-ANDROID-UX-CLEANUP-AND-MASTER-HANDOFF-LOCK`

## Update marker verification
This file is inside `/game`, and the deploy workflow copies the committed `/game` directory into the GitHub Pages artifact. A merge commit to `main` changes repository content and therefore triggers the configured push workflow.

## Phase 330 payload
- `game/android.html`
- `game/index.html`
- `game/phase329_android_table_playtest_ux_lock.js`
- `game/modules/phase328_director_preview_table_showcase_lock.js`
- `game/modules/phase330_android_ux_cleanup_master_handoff_lock.js`
- `game/android-release.json`
- `game/manifest.json`
- `game/docs/PHASE_330_ANDROID_UX_CLEANUP_MASTER_HANDOFF_LOCK.md`
- `docs/phase330_android_ux_cleanup_master_handoff_lock.md`

## Locked release policy
- APK version name: `0.1.0-rc1`
- APK version code: `1`
- Forced update: `false`
- Update prompt: `false`
- Stable web entry: `/game/android.html?channel=stable`

## Protected scope
- No public-site redesign.
- No unapproved sponsor/partner changes.
- Existing table asset remains the authority.
