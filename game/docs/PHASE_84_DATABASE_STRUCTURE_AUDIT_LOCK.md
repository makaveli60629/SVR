# PHASE-85-ESPRESSO-BANNER-RESTORE-LOCK — Full Audit + Database Structure Lock

## Scope
Game-side repair only. The website/site side is not modified.

## Critical errors found
1. **Stale build identity** — `game/index.html` still showed the old Phase 39/P39 label.
2. **Unapproved sponsor/founder branding** — runtime code and packaged assets included content that must remain disabled until written approval.
3. **No game database bridge** — the game had no safe API client for the new database/backend.
4. **Scene-routing drift** — lobby quick-jumps and private scene concepts were mixed, with incomplete direct route pages.
5. **Version drift risk** — no package-level `BUILD_VERSION.json` lock existed in the current game package.

## Fixes applied
- Added `game/modules/database_client.js`.
- Added API health check and non-blocking `game_boot` event queue.
- Added safe offline mode when no API base URL is configured.
- Added private-scene shells: Reiki, PGA Drive, Chip/Putt, VR Store, Smoker Lounge, Scorpion, Range alias.
- Removed unapproved sponsor UI media from the package.
- Replaced Reiki runtime content with red `AWAITING APPROVAL` placeholder panels.
- Replaced unapproved building ad runtime labels with `SVR SPONSOR SLOT / AWAITING APPROVAL`.
- Updated `game/index.html` to `PHASE-85-ESPRESSO-BANNER-RESTORE-LOCK`.

## Database rule
The game must never connect directly to SQL. The game only calls a secure backend API:

```text
Game/WebXR frontend → Secure API backend → SQL database
```

Allowed game-side configuration:
- `window.SVR_API_BASE_URL = "https://YOUR-API.azurewebsites.net"`
- `?api=https://YOUR-API.azurewebsites.net`
- browser localStorage key `SVR_API_BASE_URL`

Never place these in game files:
- SQL connection strings
- admin passwords
- JWT secrets
- Stripe secret keys

## Required backend endpoints
Minimum:
- `GET /api/health`

Recommended next:
- `POST /api/game/events`
- `POST /api/poker/sessions`
- `POST /api/poker/hands`
- `GET /api/store/products`
- `GET /api/admin/status`

## New structure
```text
game/
  index.html
  main.js
  reiki.html
  pga-drive.html
  chip-putt.html
  range.html
  store-room.html
  smoker-lounge.html
  scorpion.html
  modules/
    database_client.js
    private_scene_common.js
    private-scenes/
      reiki.js
      pga-drive.js
      chip-putt.js
      range.js
      store-room.js
      smoker-lounge.js
      scorpion.js
  docs/
    BUILD_VERSION.json
    GAME_DATABASE_STRUCTURE_MANIFEST.json
    PHASE_84_DATABASE_STRUCTURE_AUDIT_LOCK.md
```

## Testing checklist
- Lobby loads and top-right build label shows `PHASE-85-ESPRESSO-BANNER-RESTORE-LOCK`.
- Console has no import errors for `database_client.js`.
- If API is not configured, database state shows safe-local-mode and game still boots.
- If API is configured, `/api/health` should show online/connected.
- Reiki storefront shows only SVR / AWAITING APPROVAL placeholder content.
- Private route buttons open standalone scene pages.
- Package remains under 25 MB.
