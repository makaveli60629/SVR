# SVR Asset Source License Manifest

## Purpose
This manifest locks the rule for using outside 3D assets, nature models, textures, HDRIs, plants, rocks, trees, terrain props, and sponsor-ad visual resources in SVR Poker.

## Current source request
User requested review of Cults3D nature search resources as possible free texture/resource help.

Reference:
- `https://cults3d.com/en/search?q=nature`

## Production rule
Do not import third-party assets directly into the live game or site unless the specific asset license allows the intended use.

Every third-party asset must be recorded with:
- asset title
- creator name
- source URL
- license type
- commercial-use status
- attribution requirement
- allowed modification status
- downloaded file name
- converted file name
- repo destination path
- date imported

## Approved use cases
Third-party nature assets may be used for:
- lobby plants
- trees and landscape silhouettes
- rocks and terrain dressing
- meditation/Reiki approval-safe nature decoration
- private-room scenery
- non-branded prototype placeholders

## Restricted use cases
Do not use assets for public commercial branding, paid sponsor inventory, merchandise, or final marketplace products unless the license explicitly allows that use.

Do not use models or textures that have:
- no visible license
- unclear redistribution rights
- no commercial-use permission when commercial use is needed
- trademarked logos or branded products
- personal likenesses without permission

## Repo placement
Use these destinations after license approval:

```text
game/assets/nature/raw/
game/assets/nature/textures/
game/assets/nature/optimized/
game/assets/nature/manifest.json
site/assets/nature/
docs/assets/licenses/
```

## Optimization rules
Before game use:
- convert heavy 3D assets to GLB
- compress textures to web-friendly JPG/PNG/WebP
- target low-poly or optimized meshes for Quest
- avoid giant uncompressed textures in the main lobby
- keep every nature pack modular and removable

## Naming rules
Use safe lowercase names:

```text
nature_tree_oak_01.glb
nature_plant_floor_01.glb
nature_rock_cluster_01.glb
nature_grass_patch_01.webp
nature_license_assetname.md
```

## Current live status
No Cults3D asset is approved for production yet. Assets may be reviewed and listed, but should not be shipped until license and attribution are confirmed.

## Next action
Create `game/assets/nature/manifest.json` and add approved assets one at a time after the user selects specific models/resources.
