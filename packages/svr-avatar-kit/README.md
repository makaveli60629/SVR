# SVR Poker Avatar Kit v1

Engine-neutral avatar customization package for SVR Poker, the website dressing room, the store/inventory system, and a later Unity 6/OpenXR client.

## Goals

- One avatar record shared by website, Android, Quest, profile, store, and Unity adapters.
- Male and female base-body families with the same humanoid skeleton contract.
- Customizable skin tone, eye color, hair style/color, body proportions, hands, feet, nails, clothing, eyewear, headwear, shoes, jewelry, watches, and profile cosmetics.
- Store items equip into stable slots instead of hard-coding visuals into the poker scene.
- Existing Eric/Claudia assets remain valid as initial base bodies.
- Current `equippedOutfit` schema v1 can be converted to/from Avatar Kit schema v2.

## Package layout

- `avatar-kit.catalog.json` — customization options, slots, store lanes, starter items, and geometry compatibility metadata.
- `avatar-kit.schema.json` — portable avatar-save contract.
- `avatar-kit-core.js` — normalize, validate, equip, unequip, migrate, and legacy-bridge helpers.
- `unity/SVRAvatarDefinition.cs` — Unity-friendly serializable DTOs and slot definitions.
- `../../docs/SVR_AVATAR_GEOMETRY_STANDARD_V1.md` — geometry/rig/material rules for production assets.
- `../../site/avatar-kit-lab.html` — non-destructive browser configuration lab.

## Avatar record

Avatar Kit v2 separates the avatar into three layers:

1. **Base body** — `male` or `female` body family plus the source model.
2. **Appearance** — skin, eyes, hair, nails, and body morph values.
3. **Equipment** — clothing/accessories in stable named slots.

Example:

```json
{
  "schemaVersion": 2,
  "baseBodyId": "male-eric-v1",
  "appearance": {
    "skinToneId": "skin-06",
    "eyeColorId": "eye-hazel",
    "hairStyleId": "hair-short-curl",
    "hairColorId": "hair-dark-brown",
    "nailStyleId": "nail-natural",
    "nailColorId": "nail-clear"
  },
  "morphs": {
    "height": 0.5,
    "bodyMass": 0.5,
    "shoulderWidth": 0.5,
    "torsoLength": 0.5,
    "armLength": 0.5,
    "legLength": 0.5,
    "handScale": 0.5,
    "footScale": 0.5
  },
  "equipment": {
    "top": "top-svr-black-tee",
    "bottom": "bottom-black-jeans",
    "shoes": "shoe-black-low",
    "headwear": "none",
    "eyewear": "none",
    "outerwear": "none",
    "neck": "none",
    "wristLeft": "none",
    "wristRight": "watch-svr-classic",
    "handLeft": "none",
    "handRight": "none",
    "faceAccessory": "none"
  }
}
```

All slider values are normalized `0.0..1.0`. Each runtime maps those normalized values to safe asset-specific ranges.

## Store contract

Every avatar store SKU should include:

- `itemId`
- `storeCategory`
- `equipSlot`
- `compatibleBodyFamilies`
- `geometryProfile`
- `assetUrl`/addressable key when real art exists
- ownership / price metadata handled by the existing account/store service

Recommended store columns:

- Bodies
- Skin & Face
- Eyes
- Hair
- Nails
- Tops
- Bottoms
- Outerwear
- Shoes
- Headwear
- Eyewear
- Jewelry & Watches
- Hands
- Bundles / Limited Drops

## Geometry rule

Do not stretch clothing arbitrarily to fit every body. Production garments should be authored against the SVR humanoid skeleton and either:

- use compatible skin weights plus supported body blendshapes, or
- ship male/female fitted variants sharing one logical store `itemId`.

This avoids clipping at the poker table and keeps the same SKU usable on web/Quest/Unity.

## Unity portability

The package is intentionally data-first. Unity imports the same avatar JSON, resolves `baseBodyId`, applies morphs/blendshapes, then equips slot prefabs/addressables. This matches the Phase 423 engine-portability direction without requiring JavaScript-to-C# translation.

## Current asset status

Eric and Claudia are the initial base-body references. Existing site clothing/headwear items marked `previewDisabled` are placeholders until fitted geometry is authored. Avatar Kit makes those missing art tasks explicit rather than pretending generated primitives are final production clothing.
