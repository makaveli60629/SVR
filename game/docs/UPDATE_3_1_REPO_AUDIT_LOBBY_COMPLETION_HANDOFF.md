# SVR Poker — Update 3.1 Repo Audit + Lobby Completion Handoff

## Status
This is the working handoff for Update 3.1. Use it for Codex, Copilot, Claude, or any developer/AI agent taking over the next build.

## Current repo audit baseline
- Current checked game build label: `UPDATE-3.0-PHASE-223-PHASE-DISPLAY-DIAG-ERROR-LOG-LOCK`.
- Current active game entry is `game/index.html`.
- Current boot chain loads the game core, phase boot, stability modules, city/upstairs layers, Moon sky anchor fix, and diagnostic log.
- Current deploy workflow copies committed `/game` directly into the Pages build. Do not assume `update/game.zip` alone controls the live build.
- Current deployment workflow uses sparse checkout and direct copy of `game`, `site`, and root website files.
- Main problem: phases have drifted because direct `/game`, `update/game.zip`, and version files were not always synchronized.

## Update 3.1 goal
Stop phase drift, restore the planned premium lobby look, verify all modules, and prepare a controlled multiplayer test path.

## Non-negotiable rules
1. Game-side work only unless the user explicitly asks for website work.
2. Do not redesign or replace the current lobby baseline.
3. Preserve Android, desktop, Quest hands, and Quest controller fallback.
4. Keep controller meshes hidden or represented as hands.
5. No accidental instant teleport.
6. Keep the package lightweight and budget-aware. Use existing/procedural assets first.
7. No unapproved Reiki/Trueitive/founder branding in runtime.
8. Every new feature must be modular and removable.
9. Every phase must update all version markers together.
10. Diagnostics must stay available until the lobby is stable.

## Phase drift rule
Every game update must update these together:
- `game/index.html` build label and cache keys
- `game/phase176_boot.js` label
- `game/docs/BUILD_VERSION.json`
- `update/version.json`
- any active handoff/audit docs

Do not ship a phase if these do not match.

## Lobby visual target
The lobby should move toward the approved plan/reference:
- premium futuristic casino lobby
- Roman-style architecture around the poker table
- central OBJ poker table as the hero object
- outside-patio / overlook feeling around the table
- second-floor city overlook visible through windows
- red carpet on all stairs
- red carpet across the upstairs floor
- solid upstairs floors, no invisible walkways
- clean futuristic city texture outside windows
- sealed rear/fourth wall at spawn so players cannot see or walk into black void

## Moon and sky requirements
- Moon must not sit in the middle of the room or on the floor.
- Moon must be high in the sky and visible from the lobby.
- Moon should be slightly larger than current if it is too small after the sky-anchor fix.
- Moon is eye candy before the main centerpiece, not clutter.
- Moon must have crater texture and a soft halo.
- Mars must remain visible near the Moon but secondary.
- Moon/Mars must not visually collide with buildings.

## Required lobby geometry tasks
1. Add/restore solid second-floor surfaces.
2. Carpet all upstairs floors in red.
3. Carpet all stairs in red.
4. Add Roman-style arches/columns around the poker-table patio zone.
5. Confirm the OBJ poker table is active or document why fallback is being used.
6. Seal spawn/back/fourth wall with an entrance portal, doorway, elevator, or arrival gate.
7. Add window frames / glass panels facing the futuristic city.
8. Ensure city backdrop is visible from the second floor without blocking walk paths.
9. Keep lobby portals as storefronts only, not full private rooms.

## Module audit checklist
Verify these modules are attached, visible, and routable:
- Main poker table
- Seat route / open south-front seat
- Reiki storefront portal
- Reiki private scene route
- PGA storefront portal
- PGA Drive private route
- PGA Chip/Putt private route
- Store portal to `https://svrpoker.com/site/store.html`
- Smoker Lounge route
- Scorpion Poker route
- Sponsor placeholders
- Legends / Hall of Fame route if still present
- Watch controls
- Teleport router
- Diagnostics panel
- Moon/Mars sky system
- Android controls
- Quest controller controls
- Quest hand tracking controls

## Controls lock
Quest/Oculus controller:
- Right stick up/down: forward/back movement based on headset direction.
- Right stick left/right: 45-degree snap turn.
- Hold A/grip/trigger: aim teleport.
- Release: teleport.
- Trigger: select/watch fallback.

Hand tracking:
- Pinch/fist hold: aim teleport.
- Release: teleport.
- No instant teleport.

Android/browser:
- Maintain movement fallback.
- Maintain touch/keyboard/button fallback where applicable.

Desktop:
- Keep keyboard/test controls for quick QA.

## Diagnostics requirements
Add or preserve a diagnostic menu/button with:
- current phase
- active modules
- player position
- camera position
- XR session state
- controller handedness and axes
- teleport state
- current scene/route
- renderer FPS estimate
- visible error/warning log
- loaded private scene route status
- Moon/Mars object position
- multiplayer connection status when added

Diagnostics must be visible in desktop and available in VR without being attached to the face/camera.

## Multiplayer test requirement
Goal: two-player test only, not final MMO.

Minimum test:
- one Oculus/Quest client
- one Android/browser client
- two visible placeholder avatars/pills
- networked position sync
- display player IDs/names
- basic join/leave state
- diagnostic connection status

Acceptable placeholder avatar:
- capsule/pill body
- name tag
- simple head/hand markers

Do not block lobby completion waiting for final avatars.

## Multiplayer implementation note
Static GitHub Pages cannot host multiplayer authority by itself. Use a small backend later:
- WebSocket server
- Colyseus
- Socket.IO
- Azure App Service
- temporary local LAN test server for first validation

First implementation may be a local/dev test if production backend is not ready.

## Budget-aware rule
Assume limited funds/resources. Do not require paid assets or expensive services before validating gameplay. Use:
- procedural geometry
- existing textures
- lightweight GLB/OBJ when already available
- placeholders for multiplayer avatars
- diagnostics before polish

## Update 3.1 phase plan

### 3.1-A — Version Sync + Repo Truth Lock
- Stop phase jumping.
- Confirm active `/game` build matches docs and version files.
- Add a single source-of-truth phase registry.
- Verify deploy workflow path.

### 3.1-B — Lobby Structure Completion
- Solid upstairs floors.
- Red carpet upstairs and stairs.
- Roman-style table/patio architecture.
- Seal spawn back wall.
- Confirm OBJ poker table or safe fallback.

### 3.1-C — Sky / Moon / Window Fix
- Moon high, larger, textured, visible from lobby.
- Mars high and secondary.
- Futuristic city visible through glass/windows.
- No moon dome/floor artifact.

### 3.1-D — Module Routing Audit
- Verify all portals and private scenes.
- Remove dead buttons/routes.
- Store portal points to approved site store URL.
- Add route status into diagnostics.

### 3.1-E — Cross-Platform Controls Audit
- Quest hands.
- Quest controller fallback.
- Android fallback.
- Desktop fallback.
- Teleport hold/release behavior confirmed.

### 3.1-F — Multiplayer Placeholder Test
- Two-client position sync.
- Pill/avatar placeholders.
- Diagnostics show connection/player count.
- Do not polish final avatars yet.

## Acceptance checklist for Update 3.1
- Phase label does not regress after refresh/deploy.
- Moon is not on the floor or in the center.
- Moon is high, textured, visible, and slightly larger.
- Upstairs floor is solid and red-carpeted.
- Stairs are red-carpeted.
- Poker table area has Roman/patio-style architecture.
- Futuristic city is visible through window/glass panels.
- Spawn/back wall is sealed or has an arrival portal/gate.
- All major modules are attached and routable.
- Diagnostics show phase, errors, positions, controls, routes.
- Android and Quest controls remain available.
- Two-client multiplayer placeholder test works.
- Website is untouched unless specifically requested.

## Handoff instruction for Codex/Copilot/Claude
Do not start by rewriting the game. Start by auditing current files, then patch narrowly. Create small modules and wire them into `game/index.html`. Keep every change traceable in docs. If a fix requires removing a module, document the reason. Do not use large binary FBX or paid services for 3.1 unless explicitly approved.
