# Phase 165 — Table Clean Deploy Workflow Lock

## Scope
Game-side only. Public website/site remains untouched.

## Reason
Phase 164 added the final FBX-only table cleanup module, but the boot page was still loading Phase 161 cache keys and was not loading the Phase 164 cleanup module from the main boot module list.

## Fixes
- Bumped `game/index.html` boot authority to `PHASE-165-TABLE-CLEAN-DEPLOY-WORKFLOW-LOCK`.
- Wired `phase164_fbx_table_final_alignment_seat_anchor_lock.js` directly into `CORE_MODULES`.
- Updated cache keys from `phase161` to `phase165` so the browser cannot keep reusing the old boot path.
- Updated `update/version.json` to the Phase 165 workflow marker.

## Runtime rule
The only visible main table authority is the real FBX table. Fake/procedural table geometry, chairs, stool guide rings, and old poker-panel table clutter are blocked by the Phase 164 cleanup module.

## Test URL
`/game/?v=phase165-table-clean-deploy`

## QA checklist
- Confirm the fake geometry table is gone.
- Confirm table-adjacent visual clutter is gone.
- Confirm the FBX table remains visible.
- Confirm lobby, watch, controls, portals, and poker logic still boot.
- Confirm website content was not changed.
