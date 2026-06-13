# Phase 172A — Sponsor Module Architecture Lock

## Objective
Create the first no-code sponsor architecture so approved sponsors can be registered from the website and displayed in the game without changing game code.

## Built

### 1. Sponsor Intake Page
File: `site/sponsor-intake.html`

A no-code sponsor packet builder with fields for:
- Sponsor name
- Contact person
- Email
- Phone
- Website
- Store URL
- Hub placement
- Category
- Logo file/path
- Banner file/path
- Start date
- End date
- Days
- Hours
- Short offer
- Description
- Approval status
- Approved checkbox

The page generates a sponsor JSON packet, supports copying JSON, and supports downloading the packet.

### 2. Sponsorship Page Link
File: `site/sponsorship.html`

The sponsorship page now links directly to the sponsor intake workflow and explains the register/approve/schedule/display flow.

### 3. Example Sponsor Data Packet
File: `game/data/sponsors/example-reiki-sponsor.json`

A sample approved Reiki/wellness sponsor packet that proves the structure:
- Approved status
- Sponsor identity
- Website/store link
- Hub placement
- Schedule
- Display fields
- Admin approval metadata

### 4. Game-Side Sponsor Loader
File: `game/modules/sponsor_loader_phase172.js`

Loads approved sponsor JSON and creates a VR sponsor module:
- Sponsor display panel
- Logo disc
- Portal ring
- Schedule display
- Website/store info
- Runtime marker: `window.SVR_PHASE172_SPONSOR_MODULE`

### 5. Game Integration
File: `game/main.js`

Adds:
- Phase 172A build label
- Sponsor loader import
- Sponsor loader install after the clean octagon/skies
- Optional tick for sponsor portal animation
- Runtime lock: `window.__SVR_PHASE172_SPONSOR_MODULE_LOCK__`
- Global scene/camera/renderer handles for future admin/debug modules

### 6. Version Lock
File: `game/version.json`

Updated to Phase 172A.

## Runtime Controls

Disable sponsor module for testing:

`/game/?noSponsors=1`

Preview Phase 172A:

`/game/?v=phase172a-sponsor-module`

Sponsor intake page:

`/site/sponsor-intake.html`

## Notes
- This is a static/no-backend first pass.
- Real file upload and admin storage are next-phase backend/dashboard work.
- The JSON schema is now stable enough to connect to approval scheduling later.
- Sponsors remain modular and removable.
- Approved sponsor data controls what appears in the game.

## Commits
- `206c02fc5be5dcd25002661a5b26fc1db57d343c` — Add example Reiki sponsor data packet.
- `3ad1e51de5dd7b149d331619d020207abef5b74a` — Add Phase 172 sponsor loader module.
- `6c57e29357bc5fc97964f8da74fb7e4ec80a2c4e` — Add sponsor intake no-code packet builder page.
- `048e7f7d5b140e7a6215d0dddb4d2d0fbbff0877` — Install Phase 172A sponsor module in game.
- `2b1636d6cdc8fec846598ceeea152cef1eb3fe85` — Update game loader to Phase 172A sponsor module.
- `546b5759f0e63340ff9048a09e9c7f763640170d` — Update label override to Phase 172A.
- `fd86dfe8e0e48230f43f020f1dc16fa2ac1dee12` — Update game version to Phase 172A.
- `5d4804c68371b0bf0a9ac44fbb5ca091c21e5197` — Link sponsorship page to sponsor intake module.
