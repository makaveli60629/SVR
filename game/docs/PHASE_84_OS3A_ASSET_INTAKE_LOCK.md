# Phase 84 — OS3A Asset Intake Lock

## Purpose

This phase locks OpenSource3DAssets / OS3A as an approved **research and resource source** for SVR Poker, without bulk-importing assets or changing runtime behavior.

## Scope

Game-side planning only.

This phase does **not**:
- touch `/site`
- touch the public Matrix launch page
- replace the lobby
- import heavy model collections
- change poker logic
- change controller/watch logic
- change private-scene routing

## Approved Source

- Gallery: https://www.opensource3dassets.com/en/gallery
- Mirror/repo reviewed: https://github.com/makaveli60629/os3a-gallery
- Data-source note from OS3A: assets metadata is maintained through the upstream `ToxSam/open-source-3D-assets` data repository.

## Why approved

OS3A is useful for SVR because it is focused on discoverable GLB assets for games, VR projects, Three.js/WebXR style projects, and other 3D projects. The reviewed README describes Polygonal Mind collections with 991+ GLB assets, mostly CC0, and states that individual asset licenses must still be checked.

## Hard Rules

1. **No bulk imports.**
   Import selected assets only.

2. **GLB preferred.**
   Prefer `.glb` over `.fbx` for web/Quest runtime.

3. **Every imported asset needs manifest proof.**
   Required metadata:
   - asset name
   - source page
   - upstream source
   - license
   - target SVR room/module
   - file path
   - size before/after optimization
   - optimization status
   - approval status

4. **Keep game package under 25 MB.**
   If assets push the package above the limit, they must be removed, compressed, or lazy-loaded outside the deploy package.

5. **No unapproved sponsor branding.**
   OS3A assets may decorate Reiki/PGA/Scorpion/Store spaces, but must not introduce unapproved business names, logos, founder names, external websites, or protected IP.

6. **Site remains locked.**
   This is game-side only.

## Approved first-use targets

### Reiki private room
Allowed asset types:
- trees
- rocks
- plants
- lanterns
- benches
- calm environmental props

### PGA private driving range
Allowed asset types:
- grass props
- range signs
- cones
- flags
- yardage markers
- small environmental props

### Scorpion private poker room
Allowed asset types:
- decorative neon props
- room props
- skyline detail props
- small VIP lounge props

### VR Store private showroom
Allowed asset types:
- shelves
- racks
- mannequins
- display stands
- product pedestal props

### Main lobby
Use sparingly:
- storefront decoration only
- no full rooms imported into lobby

## Folder lock

Recommended runtime path:

```text
game/assets/os3a/
  manifest.json
  reiki/
  pga/
  scorpion/
  store/
  lobby/
```

## Next implementation phase

Phase 85 should import a **small pilot set** only:

- 2 Reiki plants/rocks
- 2 PGA range props
- 1 Scorpion room prop
- 1 VR Store display prop

Target:
- total imported optimized payload under 3 MB
- no runtime logic changes except loading the selected assets
- update `game/assets/os3a/manifest.json`
