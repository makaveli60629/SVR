# AmbientCG Import Workflow â€” SVR Poker

## Phase
PHASE-85-AMBIENTCG-SOURCE-LOCK

## Purpose
AmbientCG is approved as an open asset source for SVR Poker. Use it for PBR materials, textures, HDRIs, and selected models.

## Critical Rule
Do **not** download the entire AmbientCG library into SVR.

The SVR game package must stay under 25 MB. AmbientCG should be used as a source library, then only selected optimized outputs should be copied into the game runtime.

## Runtime Rules
- Use local optimized copies only.
- Do not hotlink asset downloads in the live game.
- Use 1K or 2K max for Quest/browser textures.
- Prefer JPG/WebP/KTX2 where practical.
- Avoid 4K/8K files in runtime.
- Add every imported asset to game/assets/open/ambientcg/manifest.json.

## Recommended SVR Uses
| SVR Area | AmbientCG Asset Type |
|---|---|
| Poker table | felt, leather, cloth, wood |
| Reiki private scene | stone, ground, calm natural materials |
| PGA private range | grass, dirt, sand |
| Scorpion room | concrete, metal, wall panels |
| VR Store | fabric, plastic, display surfaces |

## API Notes
AmbientCG API docs: https://docs.ambientcg.com/api/

Use API v3 assets endpoint for metadata discovery:
https://ambientcg.com/api/v3/assets

Example metadata query:
https://ambientcg.com/api/v3/assets?type=material&q=grass&sort=popular&limit=20&include=downloads,previews,tags

## Safe Import Process
1. Search metadata.
2. Select a tiny pilot set.
3. Download 1K/2K maps only.
4. Optimize file sizes.
5. Place runtime files under:
   game/assets/open/ambientcg/runtime/
6. Update manifest.
7. Test package size.
8. Zip validation.
9. Commit.

## Never Do
- Do not clone a full texture library into SVR.
- Do not add 8K maps to the game.
- Do not add all AmbientCG assets to game.zip.
- Do not edit the website in this phase.
