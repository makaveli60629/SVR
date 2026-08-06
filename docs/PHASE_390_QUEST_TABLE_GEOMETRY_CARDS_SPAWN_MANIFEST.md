# Phase 390 — Quest Table Geometry, Cards, Spawn, Eric, Camera 3, and Android Gameplay

## Release lock

`PHASE-390-QUEST-TABLE-GEOMETRY-CARDS-SPAWN-AUTHORITY-LOCK`

## User-reported acceptance failures

The physical Quest screenshot and test report showed five release-blocking issues:

1. Eric remained sideways.
2. The player spawned beside the poker table instead of directly in front of it.
3. A custom purple felt plane covered the hand rests and the full table top.
4. Phase 341 hole-card and community-card layers were no longer visible.
5. Android gameplay was not clearly reachable from the public Android route.

## Geometry audit

The original uploaded table asset remains authoritative:

- Primary asset: `game/assets/models/table.glb`
- Normalized table dimensions: approximately `2.734 m × 0.801 m × 1.460 m`
- Hand-rest / rail top: approximately `0.80086 m`
- Original uploaded playing-felt top (`Object002_e392c7`, material `polotno`): approximately `0.71906 m`
- Original modeled rail-to-felt relief: approximately `0.0818 m` (`3.22 in`)

The visible regression was not caused by the original GLB. Phase 388 created a separate rectangular felt plane at `table.maxY + 0.028` with render order `9388`. Phase 341 cards use render order `9341`. The later plane therefore sat above the hand rest and also rendered over the card meshes.

## Phase 390 corrections

### Exact recessed playing surface

`game/modules/phase390_quest_table_geometry_cards_spawn_authority.js`:

- Detects the uploaded table’s real inner playing-surface mesh using geometry, the `polotno` material, and felt/cloth/playing-surface names.
- Clones the exact original surface geometry instead of using a rectangular plane.
- Preserves the table’s hand-rest and rail geometry.
- Applies the SVR purple felt branding to the cloned inner surface.
- Places the playing surface `0.165 m` below the rail top, equal to approximately `6.50 inches`.
- Detaches the Phase 388/386/384 top-level felt overlays.
- Polishes armrest, leather, trim, and metal materials separately.

### Card-layer restoration

- Reasserts `PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT`.
- Rebuilds the Phase 341 presentation when the root or layout is absent.
- Requires at least 17 physical card meshes: 12 hole cards plus 5 community cards, with burn-card support retained.
- Keeps card render order above the recessed inner felt.
- Starts or advances a hand in direct Quest mode when the table is idle and no cards are visible.

### Eric upright correction

- Uses the Eric FBX skeleton’s head-to-feet anatomical vector rather than relying only on bounding-box orientation guesses.
- Rotates the existing upright wrapper until the anatomical up vector aligns with world Y.
- Normalizes Eric to approximately `1.78 m` and grounds the model.
- Continues using the authoritative uploaded `game/assets/models/eric/eric.fbx` instance.

### Fixed front spawn

`game/modules/phase390_front_spawn_final_guard.js`:

- Uses the table’s fixed local front direction rather than the user camera’s starting side.
- Places the headset directly in front of the table.
- Faces the player toward the center of the recessed playing surface.
- Replaces the predecessor direct-seat API and corrects later seat drift.

### Camera 3

- `game/camera3-live.html?v=phase390` loads the corrected table geometry and card layers before the Phase 389 production-lighting/director module.
- Legacy Camera 3 routes redirect to the Phase 390 feed.

### Android gameplay

- `/game/android.html?channel=stable&v=phase390` is the public Android route.
- `/game/android-tabletop.html?v=phase390` wraps the playable Android game and verifies that JOIN NOW, the table, hole cards, community cards, and actions are present.
- `/game/android-stable.html?v=phase390&direct=1` is the direct playable fallback.
- The web game includes five bots, hole cards, community cards, pot chips, Fold, Check/Call, Raise, All In, Next Hand, portrait/landscape responsiveness, and gyroscope support.
- APK policy is unchanged: `0.1.0-rc2`, version code `2`, no forced update, and no native rebuild claim.

## Canonical test routes after merge

- Quest: `/game/quest.html?v=phase390`
- Quest runtime: `/game/index.html?platform=quest&v=phase390&direct=1&autoseat=1&questfix=1&clean=1`
- Camera 3: `/game/camera3-live.html?v=phase390`
- Android: `/game/android.html?channel=stable&v=phase390`
- Android tabletop: `/game/android-tabletop.html?v=phase390`
- Android direct fallback: `/game/android-stable.html?v=phase390&direct=1`

## Automated acceptance

The Phase 390 workflow validates:

- the `0.165 m` recessed-surface contract;
- exact surface-authority markers;
- Phase 388 overlay removal logic;
- Phase 341 card-root restoration state;
- Eric anatomical-up state;
- final fixed-front spawn guard;
- Camera 3 corrected-table routing;
- playable Android route and fallback;
- service-worker cache epoch;
- JSON validity and JavaScript syntax;
- protected APK version/update policy;
- asset existence and secret-pattern checks.

## Manual device acceptance still required

Automated source validation cannot replace these physical checks:

1. Quest headset starts directly in front of the table and faces center.
2. Eric is upright and grounded in both eyes.
3. Hand rests remain visible around the full table.
4. Purple playing felt is visibly below the hand-rest top by the intended amount.
5. Hole cards and community cards appear above the felt.
6. Camera 3 frames the furnished table and cards clearly.
7. Android JOIN NOW opens the playable game in both portrait and landscape modes.
