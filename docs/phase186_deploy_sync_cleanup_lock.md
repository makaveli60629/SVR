# Phase 186 Deploy Sync Cleanup Lock

## Purpose

Fix the stale-loader issue where the game could still appear to load older phases, and make sure the official Phase 185 Roman luxury lobby look is the active lobby presentation.

## Added

- game/modules/phase186_deploy_sync_cleanup.js

## Updated

- game/index.html
- game/phase176_boot.js
- game/version.json

## What this phase fixes

- Updates stale index cache busting from older phase labels to Phase 186.
- Forces the latest boot chain to load.
- Starts the official Phase 185 look.
- Keeps Phase 177 hand-history filter active.
- Keeps Phase 178 movement bounds active.
- Keeps Phase 180/181 table selector active.
- Hides background buildings, skyline/tower objects, and old ad-building remnants.
- Preserves stores, sponsor hubs, Scorpion, Legends, moon, Mars, watch, teleport, hands, and controllers.

## Test URL

/game/?v=phase186-deploy-sync-cleanup

## Runtime markers

- window.SVR_PHASE185_OFFICIAL_LOOK
- window.SVR_PHASE186_DEPLOY_SYNC
- window.SVR_PHASE178_BOUNDS
- window.SVR_PHASE181_TABLE_SELECTOR

## Checklist

1. Index HUD says Phase 186.
2. Console shows Phase 185 official look marker.
3. Background buildings stop blinking.
4. Official Roman lobby is visible.
5. Store hubs remain visible.
6. Upper storefront/ad ring remains visible.
7. Table selector works.
8. Wall bounds still work.
9. Quest locomotion is not modified by this phase.

## Commits

- aa4663aec2d0159d7b138bdce1aeba78c97491c6
- 79fecc5f1504c89f702498a69172f85b0a72030f
- 8a023ffbcd496c05722cbcbc4ae2bf12a24f9294
- c95b34512067af8d1b3086e7eb2fdd982b3cea36
