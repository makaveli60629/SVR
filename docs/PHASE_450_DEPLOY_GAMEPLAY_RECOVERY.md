# Phase 450 — Deployment and Gameplay Recovery

## Purpose

Restore the automatic production deployment path so the merged Quest clean-load, control-preservation, teleport lock, and adaptive seat-height corrections can reach `gh-pages`.

## Root cause

The production workflow removed `publish/game/tools` while building the clean production tree, then required and executed `publish/game/tools/phase443-avatar-dealer-table-audit.mjs` during the following validation step. The required file could never exist, so deployment stopped before publishing.

## Correction

- Keep source-side audits before packaging.
- Stop requiring deleted development tools inside the clean publish tree.
- Validate the Phase 449 runtime module and audit from source.
- Stamp deployment health with automatic boot, adaptive seating, preserved controls, and the Phase 449 Quest route.
- Preserve the public homepage and all `site/**` files byte-for-byte from source; this phase does not edit them.

## Gameplay contract verified

The Quest entry continues loading the established shuffle/reset, table-conservation, dual-platform gameplay, VR-button deduplication, seated-deal, table/Eric, and Phase 449 safety authorities. Phase 446 cleanup must preserve cards, chips, pot, labels, and interaction objects.
