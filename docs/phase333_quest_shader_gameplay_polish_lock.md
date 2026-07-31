# Phase 333 — Quest Shader and Gameplay Polish Lock

This master handoff mirrors `game/docs/PHASE_333_QUEST_SHADER_GAMEPLAY_POLISH_LOCK.md`.

## Build
`PHASE-333-QUEST-SHADER-GAMEPLAY-POLISH-LOCK`

## Core result
- Preserves the Phase 332 professional-table, pass-line, denomination-chip, gravity, and committed-bet systems.
- Adds Quest-safe physical felt, rail, trim, chip, and card material treatment.
- Adds a PMREM environment and restrained two-light table rig.
- Adds a live VR turn/status panel.
- Adds Fold, Check/Call, Raise, All In, and Next Hand XR controls.
- Adds automatic next-hand continuation after the winner display.
- Exposes `svr:turn-changed` for later multiplayer synchronization.
- Exposes a route-only store integration hook without changing payments or store authority.

## Validation
- New JavaScript passed `node --check` before publication.
- JSON manifests parsed successfully.
- Branch is ahead of `main` with no divergence.
- No public website or sponsor/partner files were changed.
- Oculus visual and interaction acceptance remains required after deployment.

## Test route
`https://svrpoker.com/game/index.html?v=phase333-shader-gameplay`
