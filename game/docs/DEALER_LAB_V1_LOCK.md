# SVR Dealer Lab V1 — Eric / Table / Wrist Lock

Build: `DEALER-LAB-V1-ERIC-TABLE-WRIST-LOCK`

## Scope

This is an isolated, unlinked game-side laboratory. It does not modify the production lobby, website, PGA, Reiki, Scorpion, or other private scenes.

## Route

`/game/labs/dealer/`

The route is `noindex` and protected by an owner access-key gate. This is a static-host gate; it is not a substitute for server-side owner authentication.

## Existing assets reused

- `game/assets/models/eric/eric.fbx`
- `game/assets/models/eric/eric_idle.fbx`
- Eric base color, normal, roughness, and emissive textures
- `game/assets/models/table.glb`

No duplicate Eric/table binary payload is added.

## Lab modules

- `game/modules/dealer/eric_dealer_module.js`
  - FBX dealer load
  - full material/texturing pass
  - idle animation clip when available
  - procedural poker dealing overlay using Eric arm/forearm/hand bones
  - six-seat deal loop and single-deal test
  - rig report / bone diagnostics
- `game/modules/dealer/table_calibration_module.js`
  - table GLB load
  - rail/felt/collision/card-landing diagnostic surfaces
  - felt vertical drop and inner-wall margin controls
  - local calibration preset save
- `game/modules/dealer/wrist_lab_module.js`
  - left XR hand/controller wrist-watch test surface
  - controller meshes are not required
  - trigger toggles dealer action
  - squeeze toggles table guides

## Module lock workflow

1. Tune Eric scale/position and dealer motion in the lab.
2. Tune felt/rail/collision/card-plane values.
3. Save/copy the lab preset JSON.
4. Only after visual approval, promote those values into production modules.
5. Keep this lab as the permanent regression test so future rewrites can be checked against the locked preset.

## Table calibration defaults

- table top: 0.790 m
- felt drop: 0.055 m (~2.17 in)
- inner wall margin: 0.115 m (~4.53 in)
- collision drop: 0.062 m (~2.44 in)
- card lift above collision surface: 0.008 m

These are test defaults, not final production values.
