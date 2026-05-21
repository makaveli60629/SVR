# Phase 109 — Registry Export Boot Lock

## Purpose
Fixes the boot rescue error where a mixed-phase runtime imported a phase-specific export from `private_room_registry.js` that was not available in the deployed package.

## Error fixed
`SyntaxError: The requested module './modules/private_room_registry.js' does not provide an export named ...`

## Changes
- Added stable phase aliases from Phase 100 through Phase 109.
- Added compatibility object exports for Phase 101 through Phase 109.
- Updated the active runtime build label to `PHASE-109-REGISTRY-EXPORT-BOOT-LOCK`.
- Updated cache busts to `phase109`.
- Preserved Three.js/WebXR runtime.
- Did not touch the website/site side.

## Locked rule
Private room registry exports must remain backward compatible so a stale cached runtime cannot hard-crash the boot screen.
