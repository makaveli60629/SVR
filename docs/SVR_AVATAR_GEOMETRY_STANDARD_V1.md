# SVR Avatar Geometry Standard v1

This document defines the production geometry contract for SVR Poker player avatars and wearable store items.

## Coordinate and scale

- Author in real-world meters.
- Y is up.
- Character origin is centered between the feet on the floor.
- Neutral forward direction must be documented per source asset and converted consistently on import.
- No hidden scene-scale compensation in gameplay code.

## Base bodies

Initial body families:

- `svr-body-male-v1` — Eric-derived male base.
- `svr-body-female-v1` — Claudia-derived female base.

Both must resolve to the same logical humanoid joint names so clothing and gameplay anchors remain portable.

## Required humanoid anchors

At minimum, exported rigs should expose or resolve these semantic anchors:

- hips
- spine
- chest
- neck
- head
- left/right shoulder
- left/right upper arm
- left/right forearm
- left/right hand
- left/right thigh
- left/right shin
- left/right foot
- left/right toe

Optional attachment anchors:

- headwear
- eyewear
- face accessory
- neck accessory
- left wrist
- right wrist
- left palm
- right palm
- upper chest badge

Unity and Three.js adapters may map source bone names to these semantic names.

## Body morph contract

Avatar saves use normalized `0..1` values. Production meshes should provide safe ranges for:

- height
- body mass
- shoulder width
- torso length
- arm length
- leg length
- hand scale
- foot scale

Do not apply unrestricted XYZ scaling to individual skinned bones. Each body asset should map the normalized values to authored blendshapes, constrained bone adjustments, or approved hybrid deformation.

### Poker-table safety ranges

The final asset QA pass must ensure that every supported morph combination can:

- sit at the canonical SVR table without torso/felt intersection,
- place hands on or above the rail without forearm inversion,
- reach card/chip interaction zones,
- keep the head clear of the table and chair,
- keep shoes/feet below the tabletop and floor aligned,
- avoid shoulder clipping through fitted tops and outerwear.

Extreme morph combinations may be clamped by the runtime using per-body safe profiles.

## Skin and face materials

- Keep skin tone independent from clothing palette.
- Prefer material parameters or mask-based tinting over duplicate full textures for every skin tone.
- Eye iris color should be a dedicated parameter/material region.
- Preserve PBR source textures separately from engine-specific material setup.
- Avoid painting skin color into clothing textures.

## Hair

Hair uses the `hair` slot and `svr-hair-scalp-v1` compatibility profile.

Requirements:

- consistent scalp attachment origin,
- no visible floating at default head scale,
- authored variants must be tested against headwear,
- long hair should include shoulder/chest collision or conservative rigging for seated poker poses,
- Quest LODs should avoid excessive strand/alpha overdraw.

## Nails and hands

Hands are visually important in poker and must remain first-class avatar geometry.

Nail styles should:

- attach to the hand/finger rig without changing poker interaction colliders,
- keep cosmetic length within safe card/chip interaction limits,
- support a color/material parameter independent of skin tone,
- provide a low-cost Quest representation.

## Clothing fit

Production garments must use one of two approved strategies:

1. **Shared skinned garment** — same humanoid skeleton plus supported body morph/blendshape corrections.
2. **Body-family variants** — male/female fitted meshes under one logical store `itemId`.

Do not use a single rigid primitive stretched over the torso as final clothing.

Every garment asset must declare:

- logical `itemId`
- `equipSlot`
- compatible body families
- geometry profile
- body morph support level
- LODs
- material slots
- asset URL/addressable key

## Slot rules

Primary slots:

- hair
- headwear
- eyewear
- faceAccessory
- top
- outerwear
- bottom
- shoes
- neck
- wristLeft
- wristRight
- handLeft
- handRight

Conflict examples:

- full-face visor may hide eyewear,
- hood-up outerwear may hide incompatible hair/headwear,
- full-hand gloves may hide cosmetic nails,
- long coat may require bottom visibility rules.

Conflict resolution should be data-driven in catalog metadata, not hard-coded by SKU name.

## LOD targets

Each production avatar component should have platform-appropriate LODs.

Recommended intent:

- Desktop: highest fidelity source LOD.
- Android: reduced geometry/material count.
- Quest: aggressive mesh/material/alpha optimization with stable XR frame pacing.

Exact triangle budgets should be set after profiling the current table scene and target device; do not lock arbitrary counts before profiling.

## File formats

Preferred portable source/runtime interchange:

- GLB/glTF for engine-neutral mesh delivery where practical.
- FBX accepted for existing Eric/Claudia source and animation workflows.
- PNG/TGA/EXR source textures as appropriate; runtime compression is platform-specific.

## Naming

Use stable names. Suggested examples:

- `SVR_AVATAR_BODY_MALE_V1`
- `SVR_AVATAR_BODY_FEMALE_V1`
- `SVR_SLOT_HEADWEAR`
- `SVR_SLOT_TOP`
- `SVR_SLOT_WRIST_R`
- `SVR_MORPH_BODY_MASS`
- `SVR_MORPH_SHOULDER_WIDTH`

Stable names are required so the Phase 423 scene/export bridge and later Unity prefabs can resolve the same semantic objects.

## Acceptance checklist for one wearable

A wearable is not production-ready until it passes:

- male base fit,
- female base fit or declared single-family compatibility,
- minimum/default/maximum supported body-morph fit,
- seated poker pose,
- hand/card/chip interaction check when applicable,
- Android preview,
- Quest performance/LOD check,
- material/texture integrity,
- store item metadata validation,
- equip/unequip persistence.
