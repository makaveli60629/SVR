# Phase 422 — Quest Table Inspection Lock

Build: `PHASE-422-QUEST-TABLE-INSPECTION-LOCK`

## Scope

This phase is intentionally limited to the Quest/Oculus poker-table inspection experience. It does not modify the public website, Android/iPhone poker authorities, tournament rules, or the Phase 403/414/416 gameplay authorities.

## Table source

The authoritative Quest table remains the existing uploaded GLB authority: `PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY`, sourced from `game/assets/models/table.glb`. Phase 422 does not replace the original table asset.

## Geometry and materials

- The curved outer table geometry remains a padded/leather hand rest and is not used as the felt surface.
- Phase 422 creates a dedicated capsule-shaped inner playing surface named `PHASE422_TRUE_INNER_PLAYING_SURFACE`.
- The inner playing surface is recessed exactly `0.0254 m` (1 inch) below the measured top of the table/rail authority.
- Legacy Phase 390/393/421 felt overlays are visually suppressed while Phase 422 is active so they cannot stretch across the rail.
- Felt theme is dark/black with restrained purple, cyan, and gold accents, centered SVR branding, and a geometrically centered pass/bet line.
- Rail/hand-rest material is treated separately as dark leather/padding.
- Metal trim remains metallic.
- Remaining table body/frame meshes receive a dark warm wood/graphite treatment where they do not already carry a texture map.

## Quest seat inspection contract

- South/front seat is moved close to the rail with a target rail gap of `0.045 m`.
- Target seated eye height is `1.18 m`.
- The player rig is position/yaw locked for the inspection while headset head tracking remains free.
- Locomotion and all teleport paths are forced off, including normal, hand, watch, and grip teleport flags.

## Eric

Phase 422 does not reposition Eric. Eric remains owned by the existing Phase 391 authority and Phase 395 Quest hard-floor guard. The purpose of this phase is table/seat inspection, not dealer re-rigging.

## Cards and chips

- Existing Phase 331 chip interaction and Phase 334 hand/controller card interaction remain authoritative.
- Existing visible cards/chips are realigned to the Phase 422 true inner felt top rather than the old generic table top.
- Human cards flex visually while Phase 334 marks them as held, then return flat on release.
- Released props are kept on the true inner table surface by the existing table interaction/layout authorities; this phase does not introduce a second competing rigid-body engine.

## Lighting

The table receives lightweight no-shadow purple key, cyan fill, gold rim, and hemisphere lighting. Quest tone-mapping exposure is only raised to a minimum of 1.1 to keep cards, chips, rail, logo, and pass line readable without a heavy post-processing pass.

## Acceptance

Source-level acceptance is automated. Physical headset acceptance remains required for perceived seat comfort, hand reach, table scale, material appearance, card flex feel, and final lighting balance.
