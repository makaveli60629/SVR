# Phase 84 — Avatar NPC Rig Intake + Optimization Lock

## Scope
Game-side only. Website/site files are not touched.

## Purpose
Start the moving NPC/avatar pipeline using the uploaded rigged character assets while keeping the live package modular and deploy-safe.

## Included runtime candidates

- `game/assets/avatars/eric/eric.fbx`
- `game/assets/avatars/carla/carla.fbx`
- `game/assets/avatars/mei/mei.fbx`
- Downscaled 1K diffuse/normal texture previews for Eric, Carla, and Mei.

## Runtime modules

- `game/modules/avatar_asset_registry.js`
- `game/modules/npc_avatar_system.js`

## Behavior

- Spawns Eric and Carla as moving lobby NPC avatar slots.
- Spawns Mei as a static Reiki/host placeholder slot.
- Attempts to load the FBX rig files if `FBXLoader` is available.
- Falls back to lightweight procedural NPCs if FBX loading fails, preventing black screens.
- Moves whole NPC roots on simple walk loops now; rig animation retargeting is a later phase.

## Sci-fi downtown asset

`whsjqj04ge-ScifiDowntowncity.zip` is registered as a source-only private scene candidate. The full OBJ is not auto-loaded because it is heavy and should be optimized before use in Scorpion/private city scenes.

## Excluded on purpose

The large `Rigged_Human_Male_3963076[1].zip` is not copied into runtime because it would pressure the locked under-25-MB game package rule. It remains a future GLB optimization source.

## Next phase

Phase 85 should add one of these:

1. GLB conversion and animation retargeting.
2. Seated poker pose targets for Eric/Carla.
3. Private scene NPC spawn registry for Scorpion, Smoker Lounge, PGA, and Reiki.
