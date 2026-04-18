# SVR Repo + Source Audit

## GitHub repo findings
- Repo: `makaveli60629/SVR`
- Default branch: `main`
- Custom domain file present: `CNAME` contains `svrpoker.com`
- Deploy workflow: `.github/workflows/deploy.yml`

### Deploy behavior
The workflow:
- checks out the repo
- rsyncs the repo into `build/`
- excludes `.git`, `.github`, `update`, `backend`, `docs`, `modules`, `Library`, `Logs`, `Temp`, `*.zip`, and `*.fbx`
- then unpacks `update/site.zip` over `build/`
- then unpacks `update/game.zip` into `build/game`

### Implication
Live runtime FBX assets do not come from the base repo copy. They must be present inside the shipped `update/game.zip` if the live build depends on them.

## Current GitHub source state
### Root launch page
- `index.html` is a polished launch page that links to `./site/index.html` and `./game/index.html`

### Base game source in repo
- `game/index.html` is a richer A-Frame lobby scene with:
  - watch-ui
  - forearm-device
  - meta-hand-materials
  - moon-upgrade
  - lobby-floor
  - lobby-skyline
  - lobby-sprites
  - lobby-signage
  - real-table-stage
  - floating-logo
- it references `assets/models/table.glb`
- it references logo and moon textures
- it positions the rig at `0 1.62 6.15`

### Repo module quality
- `game/modules/real-table-stage.js` adds felt, table logo, animated community cards, and hand cards on top of the table model
- `game/modules/lobby-signage.js` builds a Legends Wall and Sponsorship Wall procedurally

## Uploaded local source findings
### `SVR-main.zip`
Contains an older prototype source path:
- `game/index.html`
- `game/scripts/core.js`
- `game/scripts/seat-system.js`
- `game/systems/hands.js`
- `game/systems/poker.js`
- `game/systems/teleport.js`

That older prototype:
- mixes Three.js and A-Frame-era ideas
- uses very stubby systems
- has a deck stub in poker
- has keyboard-toggle teleport
- does not match the richer current GitHub `game/index.html` module stack

### Current uploaded `game.zip`
The current uploaded package is a shell-test rig scene:
- it contains only `game/index.html`, `table.glb`, `riggedhumanmale.fbx`, `male_sitting_pose.fbx`, and a phase note
- it does not contain the richer lobby module stack from the repo base
- it is overriding the repo game with the temporary shell-test scene when deployed

## Main audit conclusion
You currently have **three layers**:
1. a polished root launch page in GitHub
2. a richer base `game/` source in GitHub
3. a temporary `update/game.zip` shell-test build that overrides the richer base game at deploy time

That is the core drift problem.

## What should happen next
1. Stop treating the shell-test `update/game.zip` as the long-term game.
2. Rebase on the richer GitHub `game/index.html` module stack.
3. Move only the working rig/bot assets and any missing runtime files into `update/game.zip`.
4. Remove debug overlay text from the live build.
5. Restore the real lobby layout/modules instead of shipping calibration scenes.

## High-priority fixes
- Restore the real poker table and table staging from the richer repo source
- Preserve south/front open seat
- Preserve standing spawn by default
- Keep Meta hands and controller fallback
- Re-merge Reiki/PGA modules as actual lobby modules, not flat shell markers
- Package every required runtime FBX/GLB/texture inside `update/game.zip`

## What is needed from the user
Optional, but helpful:
- Eric source package if Eric is the final dealer
- any final poker-specific seated/deal/chip/card animation FBX files
- confirmation whether the next pass should drop the debug rig shell entirely and rebase onto the richer repo `game/index.html`
