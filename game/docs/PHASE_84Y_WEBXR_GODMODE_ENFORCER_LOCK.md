# Phase 84Y — WebXR God-Mode Enforcer Lock

## Purpose
This phase installs a safe WebXR guardrail package for the live SVR Poker game without rewriting the lobby, poker engine, watch, skyline, or private scene routing.

## Corrected SVR Contract
The user-provided enforcer packet has been adapted to the locked SVR rules. The important correction is input handling: SVR keeps Meta/OpenXR hand tracking as the primary interaction model, but Quest/Oculus controller fallback remains preserved. Controller meshes must stay hidden, but controller input is allowed for movement, snap turn, watch fallback, and teleport fallback.

## Preserved Zones
- Lobby
- Table
- Seat
- Reiki
- Zen Den / Reiki Room
- PGA
- Legend
- Sponsor
- Scorpion

## Protected Features
- Permanent Moon/Mars sky presence
- Neon purple/cyan trims
- Watch quick navigation
- Store portal / store mirror surface
- 10-second silent win banner concept
- Espresso With Cream building ad slot
- Private scene routing

## Files Added
- `game/modules/webxr_enforcer.js`
- `game/docs/WEBXR_GODMODE_ENFORCER_MANIFEST.json`

## Files Updated
- `game/index.html`
- `game/main.js`
- `game/version.json`
- `game/docs/BUILD_VERSION.json`

## Site Safety
Website/site files were not touched.
