# SVR Poker — AI Project Manifest

## Authority
**Current production lane:** `PHASE-464-FULL-REMODEL-DEPLOY-LOCK`  
**Repository:** `makaveli60629/SVR`  
**Branch:** `main`  
**Primary browser game:** `/game/index.html`

This file is the human-readable AI handoff authority. If an older phase document conflicts with this file, this file wins unless a newer verified manifest explicitly supersedes it.

## Last verified production result
- Gameplay/remodel code baseline: `37f523c47a680d0e711ccc9e23f0d995028d77be`
- SVR Production Auto Deploy run: `35420443794` — **success**
- GitHub Pages Production Deploy run: `35420463969` — **success**
- Published `gh-pages/deploy-health.json` reports:
  - build: `PHASE-464-FULL-REMODEL-DEPLOY-LOCK`
  - Quest build: `PHASE-464-QUEST-REMODEL-FINISH`
  - Android build: `PHASE-464-ANDROID-FINAL-FIT-GUARD`
  - walkable Quest lobby enabled: `true`
  - deployed code commit: `37f523c47a680d0e711ccc9e23f0d995028d77be`

## Quest architecture
Quest now has **two separate authorities** so locomotion and seated poker do not fight each other.

### Walkable lobby
Route:
`/game/quest-lobby.html?v=phase464`

Alternate launcher:
`/game/quest.html?lobby=1`

Build:
`PHASE-464-QUEST-WALKABLE-LOBBY`

Behavior:
- real WebXR entry
- head-direction locomotion
- right-stick forward/back
- 45-degree snap turn
- hand/controller teleport path remains enabled
- wrist console active
- Phase 464 modular lobby architecture
- room links to Poker, Scorpion, Reiki VR and PGA
- does **not** load the seated-table authority

### Poker room
Acceptance route:
`/game/index.html?platform=quest&v=phase464&direct=1&tableonly=1&autoseat=1&questfix=1&seated=1&teleport=off&clean=1`

Protected authorities:
- Phase 440 = rendered table/dealer authority
- Phase 446 = seated player authority
- Phase 462 = professional lit poker room
- Phase 464 = final room remodel layer
- one rendered table only
- one Eric only
- native felt remains visible
- protective table cover remains hidden
- center logo remains visible
- table teleport remains disabled
- poker controls remain preserved

Protected ready text remains exactly:
`Table ready. Press VR GAME ON.`

Do not casually change that string: older regression tests intentionally protect it.

## Phase 464 lobby remodel
Primary module:
`/game/modules/phase464_grand_lobby_remodel.js`

Current goals:
- clean modular grand-lobby architecture
- central circulation path
- columns / ceiling structure
- controlled lighting
- clear room destinations
- swappable modules for later Unity migration
- avoid duplicating core table/dealer authorities

## Private rooms
Shared WebXR room system:
`/game/modules/private_scene_common.js`

Current shared room behavior:
- WebXR button
- hands/controllers
- locomotion/teleport rig
- room bounds
- Quest-aware Return to Lobby
- Phase 464 architectural treatment

Routes:
- Scorpion: `/game/scorpion.html?v=phase464`
- Reiki VR: `/game/reiki-vr.html?v=phase464`
- PGA Drive: `/game/pga-drive.html?v=phase464`
- Chip + Putt: `/game/chip-putt.html?v=phase464`
- VR Store Room: `/game/store-room.html?v=phase464`
- Smoker/Social Lounge: `/game/smoker-lounge.html?v=phase464`

Reiki public/holding content remains approval-safe. The VR room must not add unapproved claims, checkout, or partner assertions.

## Android
Protected poker engine:
`PHASE-403-ANDROID-POKER-ENGINE-RELIABILITY-LOCK`

Protected human turn authority:
`PHASE-414-HUMAN-TURN-ROTATION-AUTHORITY-LOCK`

Current presentation guard:
`/game/modules/phase464_android_final_fit_guard.js`

Requirements:
- one burn pile
- four poker action buttons
- no player-name/stack overlap
- safe-area handling
- portrait/landscape fit
- do not replace the protected poker engine while doing visual work

Primary mobile entry:
`/game/android.html?channel=stable&v=phase464`

## Owner Resource Manager / uploader
Owner page:
`/site/owner.html`

Supported source/resource types include:
FBX, OBJ, GLB, GLTF, MTL, BLEND, ZIP, PNG, JPG/JPEG, WEBP and KTX2.

Storage order:
1. private AWS S3 when configured
2. PostgreSQL binary fallback for smaller files when S3 is unavailable

Direct fallback default:
`SVR_DIRECT_RESOURCE_MAX_BYTES = 26214400` (25 MiB)

Resource database features:
- metadata
- display name
- category
- notes
- archive state
- assignment target
- assignment key
- runtime resource manifest

Game manifest endpoint:
`GET /api/game/resources/manifest`

### Important backend truth
The **static owner page is deployed**, but the repository contains **no backend deployment workflow for `api.svrpoker.com`**.

Therefore:
- do not claim the ZIP uploader fix is live merely because GitHub Pages is live
- `api/server.js` must be deployed on the actual API host before the new fallback routes can function
- no usable AWS deployment connector was exposed in the current ChatGPT tool session
- never request or commit AWS/database/admin secrets

## Current asset intake
User-provided test assets:

### Buildings pack by @Quaternius.zip
- size: 6,072,770 bytes
- archive entries: 54
- 10 BLEND
- 10 FBX
- 10 OBJ
- 10 MTL
- 8 PNG
- license file included
- license: **CC0 1.0 Universal / Public Domain Dedication**

This pack is approved as a technical candidate for the SVR lobby/environment pipeline.

### Additional assets
- `BirchTree_4.fbx` — 65,132 bytes
- `Bush_Snow_1.fbx` — 24,924 bytes
- `BirchTree_Autumn_4.obj` — 111,642 bytes

These files fit comfortably within the 25 MiB PostgreSQL fallback limit.

Do not claim any of these assets are live in the rendered lobby until the Owner uploader/API path has actually stored and assigned them.

## Resource-assignment targets
- dealer
- avatar-male
- avatar-female
- poker-table
- lobby-environment
- prop
- animation
- texture

Recommended building/tree assignment path after API activation:
- buildings -> `lobby-environment / city-pack`
- Birch tree -> `prop / birch-tree`
- snow bush -> `prop / snow-bush`
- autumn birch -> `prop / autumn-birch`

For runtime performance, convert production 3D assets to optimized GLB/GLTF where practical. Keep FBX/OBJ/BLEND as source/import formats.

## Deployment protection
Pushes to `main` trigger `SVR Production Auto Deploy`.

Protected checks now include:
- mobile/account authority checks
- Quest visual authority checks
- watch/table regression
- Phase 403 pot sanity
- Phase 464 remodel audit
- Phase 464 walkable lobby/private-room audit
- production tree validation
- publish to `gh-pages`
- downstream GitHub Pages deployment

Do not bypass a failed gate. Fix the failure and rerun.

## AI / collaboration rule
Use this manifest before starting a new SVR phase.

GitHub is the connected source-of-truth tool in the current session. A separate callable GitHub Copilot agent was **not exposed** in the available tool set, so do not claim Copilot performed work unless an actual Copilot tool/result exists.

## Next agenda
1. Physically test `/game/quest-lobby.html?v=phase464` in Quest and verify walking, snap-turn, teleport and wrist console.
2. Enter Poker Room from the lobby and verify table, Eric, felt, cards, lighting, seating and watch.
3. Walk-test Scorpion, Reiki VR, PGA, Chip + Putt, Store and Lounge routes.
4. Deploy current `api/server.js` to the real `api.svrpoker.com` service.
5. Upload the Quaternius ZIP through Owner Admin.
6. Verify Resource Manager record + assignment.
7. Convert selected source assets to optimized GLB and integrate them through assignment slots.
8. Continue Eric dealing-animation physical Quest acceptance.
