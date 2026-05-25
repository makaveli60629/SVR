# PHASE-236-VR-INPUT-DIAGNOSTIC-LOCK

## Purpose
Phase 236 adds a deploy smoke probe in both PowerShell and the game UI.

## Direct fix
- Adds `game/modules/power_deploy_smoke_probe.js`
- Adds `window.SVR_POWER_DEPLOY_SMOKE_PROBE`
- Adds F12 smoke probe panel
- Updates `SVR-AUTO-APPLY-AND-DEPLOY.ps1` with `-SmokeProbe`
- Keeps bridge aliases for phases 229-234
- Keeps optional module loader, so this panel does not block boot

## Locked boundaries
- Public Matrix launch page untouched.
- Direct `/game` deploy preserved.
- `update/game.zip` backup preserved.

## Test
Open `/game/?v=phase236-smokeprobe` and press `F12`.
