# SVR Poker — AI Project Manifest

## Authority
**Current production lane:** PHASE-464-FULL-REMODEL-DEPLOY-LOCK  
**Repository:** makaveli60629/SVR  
**Branch:** main  
**Primary browser game:** /game/index.html  
**Quest acceptance route:** /game/index.html?platform=quest&v=phase464&direct=1&tableonly=1&autoseat=1&questfix=1&seated=1&teleport=off&clean=1

This file is the AI handoff authority. Older phase/update documents remain history only when they conflict with this manifest.

## Current architecture
- Static production deploy: GitHub Actions -> gh-pages -> GitHub Pages/custom domain.
- Site/admin API source: /api/server.js, PostgreSQL via DATABASE_URL.
- Owner panel: /site/owner.html.
- Resource upload: private S3 when configured; PostgreSQL binary fallback for files up to the configured direct-upload limit.
- Resource metadata/assignments: PostgreSQL.
- Game resource manifest: GET /api/game/resources/manifest.
- Secrets must stay in deployment environment variables, never browser code or GitHub source.

## Phase 464 remodel
### Main lobby
- /game/modules/phase464_grand_lobby_remodel.js
- Adds modular central runway, columns, ceiling architecture, room portal markers and controlled lighting.
- Does not replace poker/table authority.
- Structured as removable Three.js modules for later Unity migration.

### Quest
- /game/modules/phase462_quest_professional_table_room.js remains the base professional table room.
- /game/modules/phase464_quest_remodel_finish.js is the current visual finish layer.
- Phase 440 remains the approved rendered table/dealer authority.
- Phase 446 remains seat authority.
- No extra table or Eric is permitted.
- No tabletop cover may obscure native felt.
- Current required player experience: automatic table boot, seated front position, visible Eric, readable cards/felt/watch, stable lighting.

### Android
- Protected poker engine: PHASE-403-ANDROID-POKER-ENGINE-RELIABILITY-LOCK.
- Human turn authority: PHASE-414-HUMAN-TURN-ROTATION-AUTHORITY-LOCK.
- Release wrapper lineage: Phase 420.
- Current presentation guard: /game/modules/phase464_android_final_fit_guard.js.
- Requirements: one burn pile, four action buttons, no player-name/stack overlap, safe-area fit in portrait/landscape.

### Private rooms
Separate routes stay modular:
- /game/scorpion.html
- /game/reiki.html
- /game/pga-drive.html
- /game/chip-putt.html
- /game/store-room.html
- /game/smoker-lounge.html

Shared 3D rooms use /game/modules/private_scene_common.js with PHASE-464-PRIVATE-ROOM-REMODEL architecture.
Reiki remains approval-safe and must not gain unapproved claims/media/payment behavior.

## Resource Manager
Owner-only management UI is in /site/owner.html.
Supported resources include FBX, OBJ, GLB/GLTF, MTL, BLEND, ZIP and common texture formats.

Storage policy:
1. Preferred: private S3 + PostgreSQL metadata.
2. Fallback: PostgreSQL BYTEA binary storage for smaller uploads while S3 is unavailable.
3. Game consumes only owner-assigned, ready, non-archived resources.
4. Runtime uses short-lived signed URLs/tokens.

Assignment targets:
- dealer
- avatar-male
- avatar-female
- poker-table
- lobby-environment
- prop
- animation
- texture

## Uploaded test resources from current work session
User supplied:
- Buildings pack by @Quaternius.zip (~6.1 MB)
- BirchTree_4.fbx
- Bush_Snow_1.fbx
- BirchTree_Autumn_4.obj

These are suitable uploader acceptance-test assets. Do not claim they are deployed into the live scene until the owner upload/API path is successfully exercised.

## Auto-deploy rules
- Pushes to main trigger SVR Production Auto Deploy.
- Deploy must run Phase 464 remodel audit.
- Production deploy health must report PHASE-464-FULL-REMODEL-DEPLOY-LOCK.
- Quest health must report PHASE-464-QUEST-REMODEL-FINISH.
- Android health must report PHASE-464-ANDROID-FINAL-FIT-GUARD.
- Legacy Phase 440/455 source modules may remain for protected authority/rollback lineage, but deployment metadata must describe the current Phase 464 build.

## Acceptance checklist
1. GitHub Actions production workflow succeeds.
2. GitHub Pages workflow succeeds.
3. /deploy-health.json commit matches current main deployment.
4. Owner login works without exposing credentials.
5. Admin resource ZIP upload succeeds using S3 or PostgreSQL fallback.
6. Resource appears in owner library and can be assigned.
7. Quest route loads without duplicate table/Eric/cover geometry.
8. Quest table, Eric, cards, watch and room lighting are visible in headset.
9. Android regular game loads without overlay collisions; one burn pile; four player actions.
10. Lobby portal destinations and private room routes load without missing-route errors.

## Known external activation dependency
The static site auto-deploy is controlled in this repo. The separate api.svrpoker.com host must actually deploy the current /api/server.js for new upload/resource endpoints to become live. Do not claim the uploader fix is live until that API deployment is verified.

## Next work after acceptance
- Run the supplied building/tree assets through Owner Resource Uploader.
- Assign selected optimized models to lobby/environment slots.
- Add runtime GLB-first asset loading; keep FBX/OBJ as source/import formats.
- Continue Eric dealing-animation acceptance and physical Quest headset QA.
