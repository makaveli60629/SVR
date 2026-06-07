# SVR Version 1.4.1A â€” Sky + Quest Only Safe Patch

## Baseline rule
This patch must be applied only after the correct 1.4G / version 1.4.1 baseline is restored and visually confirmed.

## Touch scope
Only these active files may change:

- game/modules/world_skyline.js
- game/modules/teleport.js
- game/docs/SVR_VERSION_1_4_1A_SKY_QUEST_ONLY_LOCK.md
- game/docs/BUILD_VERSION.json
- game/version.json
- update/version.json
- update/game.zip regenerated from the current local game/ folder

## Protected
Do not touch or rebuild:

- Reiki Hub/storefront/mother module
- Reiki hologram/video setup
- lobby layout
- storefront placements
- site files
- poker/table modules
- private room routes

## Change intent
- Raise Moon/Mars higher into the visible sky without moving them out of view.
- Keep full Moon/Mars textures and bump maps.
- Scale Moon/Mars larger.
- Moon rotates.
- Mars rotates and orbits the Moon.
- Quest right-stick forward stays headset-forward.
- Teleport ray is forced in front; it must not aim behind the player.

## Recovery
A local backup of the original sky/teleport files is created under _svr_local_backups/ before patching.
