# Phase 101M - Visible Build Label Unlock and Phase 260 Geometry Preserve

## Purpose

Fix the appearance that the project is stuck on Phase 260.

Phase 260 is still the preserved geometry layer, but it should not be the visible/current build label after Phase 101G through Phase 101L patches have been applied.

## Issue

`game/phase260_roman_canopy_archway_final_lock.js` was still setting:

```text
window.SVR_LOCKED_FINAL_BUILD = PHASE-260-ROMAN-CANOPY-ARCHWAY-FINAL-LOCK
```

It also set the browser title and HUD status to Phase 260, so the live page looked like no 101G/101H/101I/101J/101K/101L work had been applied.

## Patch applied

Updated:

```text
game/phase260_roman_canopy_archway_final_lock.js
```

Added visible stack label:

```text
PHASE-101M-CURRENT-STACK-VISIBLE-LOCK
```

The file now preserves:

```text
PHASE-260-ROMAN-CANOPY-ARCHWAY-FINAL-LOCK
```

as the geometry layer only.

## Runtime status object

Use browser console:

```text
window.SVR_PHASE101M_CURRENT_STACK
```

Expected:

```text
active: true
visibleBuild: true
phase260GeometryPreserved: true
```

Loaded stack should include:

```text
101G HUD cleanup
101H geometry cleanup
101I camera/path polish
101J locomotion forward lock
101K Quest performance
101L live QA
```

## Expected visible result

Browser title should show:

```text
SVR Poker • PHASE-101M-CURRENT-STACK-VISIBLE-LOCK
```

HUD/status should show:

```text
Phase 101M current stack loaded • Phase 260 geometry preserved
```

## Locked rule

This phase only changes visible build/status reporting. It does not rebuild the lobby, remove Phase 260 geometry, change Android movement, or add Unity-only logic.

## Commit name

```text
Phase 101M - Visible Build Label Unlock, Preserve Phase 260 Geometry
```
