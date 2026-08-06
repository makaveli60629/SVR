# SVR Poker Phase 391 — Production Consolidation and Auto-Deploy Manifest

## Release lock

`PHASE-391-PRODUCTION-CONSOLIDATION-AUTO-DEPLOY-LOCK`

## Purpose

Phase 391 consolidates the Phase 389 visible-site work and the Phase 390 physical Quest corrections into one production release for:

- Meta Quest / Oculus gameplay;
- Android browser gameplay;
- Camera 3 website preview;
- avatar dressing room and profile showroom;
- public routing, caches, metadata, deployment, and release health.

The release preserves the original uploaded poker table and removes runtime paths that could create duplicate tables, dealer models, camera controllers, felt overlays, or seat controllers.

## Full audit findings

### 1. Platform manifest remained on Phase 367

`game/modules/phase340_platform_manifest.js` still identified itself as Phase 367 and loaded historical authority modules. The active Quest manifest included a second uploaded-table authority, while the active Camera 3 manifest included two older camera controllers.

### 2. Multiple Quest table authorities were active

The Quest route imported the Phase 380 original-table authority and the Phase 379 procedural-table authority. The platform manifest also loaded the Phase 358 uploaded-table authority. These paths could replace, hide, or compete with the intended original `table.glb` object.

### 3. The Phase 388 dealer module controlled unrelated systems

`phase388_quest_table_player_eric_authority.js` combined:

- Eric loading and orientation;
- seat placement and continuous seat correction;
- locomotion locking;
- an additional top-level felt plane;
- table lighting;
- duplicate-object cleanup.

That monolithic authority could override the Phase 390 fixed-front spawn and recreate the felt plane that covered the hand rests and cards.

### 4. Camera 3 could load duplicate controllers and dealers

Camera 3 loaded the Phase 339 orbit controller, Phase 350 visibility/lighting controller, the newer Phase 389 director controller, and the Phase 368 procedural dealer. This created competing camera behavior and duplicate dealer risk.

### 5. Service workers retained retired modules

The Phase 390 service-worker manifests still preloaded the Phase 388 combined seat/dealer/felt module. A stale service-worker cache could therefore restore a retired authority after source changes.

### 6. Android gameplay existed but required stronger public proof

`game/android-stable.html` contains a complete local play-money Texas Hold’em game, but public users enter through wrapper routes. Phase 391 adds explicit wrapper validation, a visible direct fallback, and canonical Android routing.

## Phase 391 corrections

### Consolidated platform manifest

`game/modules/phase340_platform_manifest.js` now uses:

- build `PHASE-391-PRODUCTION-CONSOLIDATION-AUTO-DEPLOY-LOCK`;
- version `phase391`;
- one original-table authority path;
- no Phase 358 uploaded-table authority in the active Quest manifest;
- no Phase 379 procedural-table authority in the active route;
- no Phase 339 or Phase 350 Camera 3 controllers in the active Camera 3 manifest;
- platform-specific load-order and duplicate validation.

### Single original poker-table authority

The authoritative table remains:

- primary: `game/assets/models/table.glb`;
- fallback: `game/assets/table.fbx`;
- runtime name: `PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY`.

`phase391_production_runtime_audit.js` removes competing historical table roots while explicitly preserving the Phase 341 card-presentation root.

### Eric-only dealer authority

`game/modules/phase391_eric_dealer_authority.js` replaces the combined Phase 388 authority for production loading.

It:

- loads `game/assets/models/eric/eric.fbx`;
- uses head-to-feet skeleton direction to select anatomical upright orientation;
- normalizes Eric to approximately `1.78 m`;
- grounds the model;
- positions him at the dealer side of the table;
- removes duplicate Eric, procedural dealer, and skeleton-helper roots;
- does not create felt, move the player, lock locomotion, or install table lighting.

### Furnished recessed table and cards

Phase 390 table corrections remain authoritative:

- exact uploaded inner playing-surface geometry is cloned;
- the purple branded surface is `0.165 m`, approximately `6.5 in`, below the hand-rest top;
- hand rests, leather, trim, and metal remain visible;
- retired Phase 384/386/388 top-level felt planes are removed;
- `PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT` is rebuilt when absent;
- at least 17 physical card meshes are required;
- cards render above the recessed surface.

### Quest front spawn

`phase390_front_spawn_final_guard.js` remains the final spawn authority:

- places the headset directly in front of the original table;
- faces the center of the recessed playing surface;
- limits automatic correction to the startup window so normal play is not permanently pinned.

### Camera 3 production route

`/game/camera3-live.html?v=phase391` now loads:

1. the platform core without old Camera 3 controllers;
2. the Phase 380 original table;
3. Phase 341 cards;
4. the Phase 391 Eric-only authority;
5. the Phase 390 recessed-surface and card guards;
6. the Phase 389 production director camera and lighting;
7. the Phase 391 runtime audit.

The Phase 368 procedural dealer is not loaded by Camera 3.

### Android production route

Canonical Android routes:

- public entry: `/game/android.html?channel=stable&v=phase391`;
- responsive wrapper: `/game/android-tabletop.html?v=phase391`;
- direct playable fallback: `/game/android-stable.html?v=phase391&direct=1`.

The wrapper verifies:

- `JOIN NOW` exists;
- the game table exists;
- hole-card and community-card roots exist;
- exactly four main action buttons exist;
- responsive CSS and layout modules load;
- a direct fallback remains visible if wrapper verification fails.

The Android game includes six total players, five bots, a 52-card deck, hole cards, community cards, pot and chip presentation, Fold, Check/Call, Raise, All In, Next Hand, deterministic hand ranking, portrait/landscape layouts, safe-area support, and gyroscope support.

## Runtime production audit

`game/modules/phase391_production_runtime_audit.js` verifies and reports:

- renderer, scene, and camera readiness;
- original-table authority;
- absence of visible competing table roots;
- recessed playing surface;
- Phase 341 card root and card count;
- Eric visibility, anatomical upright state, and grounding;
- Quest fixed-front spawn API;
- poker action APIs;
- Camera 3 production-lighting root;
- Quest/Camera 3 pixel-ratio budget.

Runtime QA entry points:

- `SVR_PHASE391_BOOT_QA()`;
- `SVR_PHASE391_ERIC_QA()`;
- `SVR_PHASE391_PRODUCTION_QA()`;
- `SVR_PHASE391_ANDROID_WRAPPER_QA()`;
- `SVR_PHASE391_CAMERA3_ROUTE_QA()`.

## Duplicate-removal policy

Retired modules remain in repository history for auditability, but Phase 391 removes them from active production imports and caches. The active runtime does not load:

- `phase358_quest_uploaded_table_authority_lock.js` as a table authority;
- `phase379_quest_procedural_table_authority.js`;
- `phase388_quest_table_player_eric_authority.js`;
- `phase388_front_south_seat_authority.js`;
- `phase339_camera3_table_orbit_lock.js`;
- `phase350_camera3_visibility_lighting_lock.js`;
- `phase368_card_dealer_animation_lock.js` on Camera 3.

## Canonical Phase 391 routes

- Quest entry: `/game/quest.html?v=phase391`
- Quest runtime: `/game/index.html?platform=quest&v=phase391&direct=1&autoseat=1&questfix=1&clean=1`
- Camera 3: `/game/camera3-live.html?v=phase391`
- Android entry: `/game/android.html?channel=stable&v=phase391`
- Android wrapper: `/game/android-tabletop.html?v=phase391`
- Android direct game: `/game/android-stable.html?v=phase391&direct=1`
- Avatar room: `/site/avatar.html?v=phase389&deploy=phase391`
- Profile showroom: `/site/profile.html?v=phase389&deploy=phase391`

## Automated testing

The authoritative `Phase 391 Production Consolidation Audit` workflow checks:

- canonical routes and build markers;
- absence of retired runtime imports;
- one-table and duplicate-cleanup contracts;
- Eric anatomical-upright authority;
- recessed-surface and card-restoration contracts;
- fixed-front Quest spawn;
- Camera 3 production path and lighting;
- Android game elements and action controls;
- service-worker cache epoch and retired-module removal;
- JSON validity;
- JavaScript syntax;
- required asset existence;
- APK protection policy;
- secret-pattern scan;
- production and Pages workflow contracts.

Production deployment performs a second source validation, rebuilds a clean `gh-pages` tree, writes `deploy-health.json`, and triggers GitHub Pages deployment.

## Protected APK policy

Unchanged:

- package: `com.svrpoker.app`;
- APK version: `0.1.0-rc2`;
- version code: `2`;
- `forceUpdate`: `false`;
- `showUpdatePrompt`: `false`;
- `nativeApkRebuild`: `false`.

Phase 391 updates the web runtime and does not claim a new native APK build.

## Manual physical acceptance

Source and workflow tests cannot reproduce a real headset or phone GPU. After deployment, final physical acceptance remains:

1. Quest opens without a black or blocked stereoscopic view.
2. The player starts directly in front of the table and faces center.
3. Eric is upright and grounded in both eyes.
4. Only one furnished poker table is visible.
5. Hand rests remain visible above the recessed purple playing surface.
6. Hole cards and community cards appear above the felt.
7. Poker actions complete a hand without freezing.
8. Camera 3 frames the furnished table, cards, and Eric with adequate lighting.
9. Android JOIN NOW opens the playable game in portrait and landscape.
10. Android controls remain reachable across safe-area and keyboard/viewport changes.
