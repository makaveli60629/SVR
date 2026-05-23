# SVR Poker Chips Asset Import Plan

## User request
Use the poker chip asset from the user's Cults3D order and/or repo asset backup ZIPs for SVR Poker chips.

Reference supplied by user:
- `https://cults3d.com/en/orders/159000639`

## Access note
The Cults3D order URL is private/account-gated. The game should use the actual downloaded asset files that the user owns and has placed in the repo backup folder, not scrape from the order page.

## Import target
Poker chip assets should be converted into optimized WebXR-ready files and placed in:

```text
game/assets/poker/chips/raw/
game/assets/poker/chips/textures/
game/assets/poker/chips/optimized/
game/assets/poker/chips/manifest.json
```

## Game usage target
Use the optimized chip model/texture for:
- flat realistic chip stacks
- call amount staging
- raise controls
- pot stack
- pot vacuum animation to winner
- table chip rack
- Scorpion room poker presentation

## Required denominations
Create or map chip variants for:
- 1
- 5
- 25
- 100
- 500
- 1000
- 5000

## Optimization rules
Before loading in the game:
- Do not load raw ZIPs directly in the main render path.
- Convert heavy models to GLB.
- Keep one shared chip geometry where possible.
- Use material/color variants for denominations.
- Keep texture size small for Quest/WebXR.
- Avoid high-poly casino-chip models in every stack.
- Use instancing or merged stack meshes for performance.

## License rule
Even if downloaded through the user's Cults3D account, record:
- product title
- creator
- source URL
- order/download reference
- license type
- commercial use status
- attribution requirement
- original ZIP/file name
- converted GLB file name
- import date

## Runtime rule
Chips must be modular. The poker logic must not depend on one specific paid asset. If the asset fails to load, the game should fall back to procedural flat chip discs.

## Next implementation phase
PHASE-111-POKER-CHIPS-ASSET-LOCK

Scope:
1. Locate chip ZIP in asset backup folder.
2. Inspect contents.
3. Extract source model/textures.
4. Convert to optimized GLB/material variants.
5. Create chip manifest.
6. Add fallback procedural chip module.
7. Wire Scorpion table to use optimized chips if available.
