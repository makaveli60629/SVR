# PROJECT MANIFEST: SCARLETT VR CASINO SUITE

## Current lock

**Project:** ScarlettVR Poker / SVR Poker  
**Current active baseline:** `PHASE-131-GAME-CLEAN-BOOT-AUDIT-REPAIR-LOCK`  
**Track:** Game-side only unless the user explicitly opens a site/public-page track.  
**Primary target:** WebXR / Meta Quest Browser, with desktop/browser preview support.  
**Hosting/deploy:** Netlify is the current locked hosting target for fast asset delivery, connected to GitHub repository `makaveli60629/SVR`.

## Hosting and domain lock

- Active Netlify deploy instance: `curious-kelpie-b6bb99.netlify.app`
- Production domain: `svrpoker.com`
- WWW domain: `www.svrpoker.com`
- Domain/SSL may be in DNS propagation at times; keep a direct Netlify access path available.
- Public launch page must include a high-visibility `NewServer` button linking to the Netlify game deployment:

```text
https://curious-kelpie-b6bb99.netlify.app/game/index.html
```

## Public page UI lock

The public root `index.html` must keep a bottom/control-dock-style action area:

- Container id: `control-dock-container`
- Main game button label: `Launch VR Room`
- Secondary button label: `NewServer`
- `NewServer` color target: neon teal `#00f5d4`
- `NewServer` purpose: direct Netlify fallback during custom-domain propagation or SSL/network transition.

## Non-regression rules

1. Preserve the locked lobby baseline unless the user explicitly requests a full scene rebuild.
2. Preserve the Phase 131 clean boot path.
3. Preserve modular structure; features must be removable/swappable.
4. Do not touch `/site` or the public website from the game track.
5. Do not expose secrets, admin credentials, Stripe keys, SQL strings, API tokens, or private service keys in browser code.
6. Keep unapproved Reiki/sponsor/founder branding disabled. Use SVR placeholders only unless explicitly approved.
7. Preserve watch baseline: forearm watch visible, screen facing user, and poker/teleport controls preserved.
8. Preserve Quest controller fallback while hiding controller models. Controllers may drive movement/teleport, but visual representation must remain hands/VR body UI rather than visible controller meshes.
9. Preserve hand-tracking teleport fallback where possible.
10. Keep game deliverables under 25 MB where practical.

## Current repository architecture

Current repo architecture uses the `/game` modular runtime, not the older single-root `index.js/world.js` layout.

### Current active game files

- `game/index.html` — game entry and clean boot loader.
- `game/main.js` — main game orchestrator, imports runtime modules.
- `game/modules/` — modular game logic and feature modules.
- `game/assets/` — game assets, textures, audio, models.
- `update/version.json` — current build marker.
- `docs/` — manifests, audit notes, restore notes.

### Current clean boot rule

`game/index.html` should load only the primary runtime and the clean boot audit guard unless a module is intentionally required from HTML:

```html
<script type="module" src="./main.js?v=phase131-clean-boot"></script>
<script type="module" src="./modules/phase131_clean_boot_audit.js?v=phase131-clean-boot"></script>
```

Do not add many standalone patch scripts back into `game/index.html`; this caused duplicated panels, stale labels, and runtime collisions.

## Interaction rules

### Visual input policy

- No visible controller models.
- Quest/Oculus controllers may be used as hidden input fallback.
- Hand tracking remains a major interaction path.
- Controller input should render as hands or UI state, not hardware controllers.

### Quest controls target

- Stick forward/back movement.
- 45-degree snap turn.
- Hold trigger/A/grip to aim teleport.
- Release to teleport.
- Hand pinch/fist fallback for teleport when tracking works.
- Teleport must not freeze the session.

## Spawn/orientation lock

- User must not spawn in the middle of the table.
- Safe lobby spawn should be outside the table zone.
- Spawn should face north.
- North is behind Claudia / toward the main reference wall based on prior lobby orientation lock.

## Sky lock

- Moon should be high above the lobby, large enough to see, not low against building walls.
- Mars should start/appear high toward the east.
- Moon and Mars should slowly orbit the lobby.
- Sky module should remain separate and removable.

## Floor/performance lock

- Lobby floor must remain visible.
- Black-frame/edge artifacts during head turning must be reduced through modular view/performance control.
- Quest safe mode can reduce framebuffer scale, pixel ratio, lighting, fog, and shadows.
- Performance manager must stay modular.

## Poker/table rules

- Dedicated poker pit configuration.
- Max 6 seats per active table.
- Cards deal left-to-right from dealer button perspective.
- Win result should show visual/floating text for about 10 seconds.
- Winning player/avatar/station should highlight.
- Winning hand and community cards should be legible.
- Dealer should not rely on spoken/audio win announcement.
- Scorpion Room is the private room for real poker gameplay; main lobby should keep only portals/showpieces, not full private experiences embedded in lobby.

## Private scene routing lock

Main lobby may contain storefront/portal entries, but full experiences must stay as separate routes/scenes:

- `game/reiki.html`
- `game/pga-drive.html` / `game/range.html`
- `game/chip-putt.html`
- `game/store-room.html`
- `game/smoker-lounge.html`
- `game/scorpion.html`

## Active/private modules

- Lobby
- Seat
- Reiki
- PGA
- Drive
- Chip/Putt
- Legend
- Sponsor
- Scorpion
- Store
- Lounge

## Website/backend separation

- `/site` and public root website are separate from game work.
- Static frontend must call secure backend API for SQL/admin/store/membership/donation data.
- Never put database or payment secrets in browser files.

## AI operating directive

When generating code changes:

1. Provide full file contents for any file the user needs to copy manually.
2. Avoid placeholder comments like `// rest of code here` in copy/paste deliverables.
3. Prefer direct repo edits only when tools are available and the user asks for repo changes.
4. Use one module at a time when possible.
5. Audit before editing.
6. Preserve locked features and avoid feature regression.
7. Create or update a manifest after each major phase.

## Phase 131 status

Phase 131 cleaned the boot path by removing duplicate standalone patch modules from `game/index.html`, adding `phase131_clean_boot_audit.js`, and preserving the Phase 130 floor/sky/performance modules through `main.js`.

Required test URL:

```text
https://svrpoker.com/game/?v=phase131-clean-boot
```

Expected visible label:

```text
BUILD: PHASE-131-GAME-CLEAN-BOOT-AUDIT-REPAIR-LOCK
```
