# PHASE 263 — Missing Asset Fallback Lobby Render Lock

## Problem
Runtime shield and black screen were visible while route health was OK.
The panel showed missing assets:
- legend_character.glb
- legend_animated.glb
- riki plant OBJ
- table.glb
- sitting_pose.fbx

## Fix
Added:
- game/modules/phase263_asset_fallbacks.js

The module creates procedural fallback:
- poker table
- rail
- pass/bet line
- SVR center marker
- chips
- community cards
- legend placeholder
- plant placeholder
- seated placeholder

## Goal
The lobby must render even if optional GLB/OBJ/FBX assets are missing.

## Preserved
- Site untouched.
- Route health panel.
- Store kiosk.
- Reiki/PGA/Store/Smoker/Scorpion routes.
- Phase 260 safe loader.
- Phase 261 interaction repair.
- Right-to-left deal rule.

## Next Phase
PHASE-264-MODEL-ASSET-RESTORE-AND-PATH-LOCK
