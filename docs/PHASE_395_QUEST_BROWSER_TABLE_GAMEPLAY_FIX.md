# Phase 395 — Quest Browser / Table Gameplay Fix

## Release lock

`PHASE-395-QUEST-BROWSER-TABLE-GAMEPLAY-FIX-LOCK`

## Scope

Phase 395 is Quest/browser testing work only. The approved Android Phase 394 table remains the Android production authority and is not redesigned in this phase.

## Quest Browser public-page correction

- Detects Quest / Oculus / Meta Quest user agents before the public page is painted.
- Loads `launch-quest.css` only as an additional layout authority.
- Centers the public launch page horizontally in Quest Browser.
- Centers the logo, copy, three public buttons, platform notice, and footer.
- Uses a Quest-landscape layout that can shrink vertically instead of pushing the public page to one side.
- Quest public button routes to `/game/quest.html?v=phase395`.
- Android public routing remains `/game/android.html?channel=stable&v=phase394`.

## Quest table calibration

- Original uploaded poker table remains the table authority.
- Target presentation width: approximately **3.58 m**.
- Target table top: approximately **1.03 m**.
- Fallback table bottom target: approximately **-0.015 m**.
- The runtime attempts to identify the lower/base trim line and place that trim at floor level; if no reliable named line is found it uses the table-bottom floor-contact fallback.
- Inner felt remains recessed approximately **0.12 m** below the rail/hand-rest top.
- Older Phase 390 cover surface is hidden when the Phase 393 generated inner felt is available.
- Rail, leather, and metal material values receive a conservative polish rather than a model replacement.

## Eric dealer stability

- Target Eric height remains **1.78 m**.
- Dealer gap is reduced to approximately **0.22 m** beyond the dealer edge.
- Phase 395 places Eric at an absolute dealer target rather than applying repeated additive vertical corrections.
- Pelvis/root local translation is restored to a captured baseline before grounding.
- A final per-frame hard guard keeps Eric at the floor and at the dealer target if an older Quest authority tries to reposition him.
- Eric remains upright and faces the table with yaw-only root rotation.

## Quest seating

- Player is placed at the front/south playable seat automatically.
- Target front-rail gap: approximately **0.10 m**.
- Target seated eye height: approximately **1.22 m**.
- Startup seat correction remains bounded and then releases normal locomotion.
- XR session start requests a fresh seated correction for testing.

## Card-play recovery

- Phase 341 remains the physical card presentation authority.
- Card layout is rebuilt **after** the final Phase 395 table calibration so card coordinates match the enlarged table.
- Requires at least **17 physical card meshes**.
- Card meshes are forced visible-capable, not frustum-culled, and rendered above the table surface.
- If the poker engine is idle/showdown and no physical cards are visible, Phase 395 can request a test hand so dealing can be observed.
- Burn/community/hole-card state still comes from the existing poker engine.

## Quest lighting

- Adds a lightweight no-shadow Quest table lighting group.
- Hemisphere fill improves general readability.
- Warm key light is centered over the table.
- Purple fill light adds separation without recreating the lobby lighting system.
- Renderer exposure is only raised to a modest minimum when supported.

## Android lock

Phase 394 Android is intentionally unchanged:

- perimeter player layout
- lower pot and unobstructed SVR logo
- larger community cards
- burn tray animation
- featured REIKI sponsor plaque
- 15-second turns
- custom raise slider/presets
- poker sounds/haptics
- continuous play / XP / ranks
- APK RC2 manual-update policy

## Physical Quest acceptance required

Automation can verify source/runtime contracts but cannot reproduce headset perception. Test these in the Quest headset:

1. Public page is centered in Quest Browser before entering VR.
2. Enter VR places the user close to the front rail and already seated.
3. Bottom/base trim line visually meets the floor.
4. Table feels modestly larger than Phase 393 without oversized proportions.
5. Eric remains on the floor for several minutes and does not rise.
6. Eric is visibly closer to the dealer edge.
7. The recessed felt is visible with no black cover hiding the playing surface.
8. Card dealing becomes visible and a test hand starts when the table is idle.
9. Lighting is brighter but still comfortable in Quest.
