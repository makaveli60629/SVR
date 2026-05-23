# SVR-Version 0.1 Master Blueprint

## Permanent rule

SVR returns to GitHub + PowerShell + GitHub Actions workflow as the official deploy workflow. Remove the temporary NewServer rule from the public launch page and manifests. The project must be modular, performance-first, VR-ready, account-ready, AWS-database-ready, sponsor-ready, charity/impact-ready, and marketable as a professional interactive WebXR poker/social hub.

## Hosting and deploy workflow

- Source of truth: GitHub repository `makaveli60629/SVR`.
- Deployment workflow: GitHub Actions / Auto Workflow.
- Operator workflow: PowerShell commands from a local repo checkout.
- Temporary NewServer button/rule: removed.
- Public site and game must align through stable routes, shared status metadata, and secure backend APIs.

## Database rule

- Use AWS database/backend direction for future production data.
- Never expose database passwords, IAM secrets, API keys, Stripe keys, admin passwords, or JWT secrets in browser code.
- Browser game/site must call secure backend API endpoints only.

## Required backend domains

- Auth/accounts
- In-game profile
- Admin/god-mode privileges
- Moderator privileges
- Sponsorship accounts
- Charity/impact programs
- Game sessions
- Poker table sessions
- Hand history
- Player inventory/cosmetics
- Store products
- Donations/support
- Analytics/events
- Audit logs

## Game structure lock

Current active game structure:

- `game/index.html` — clean entry
- `game/main.js` — runtime orchestrator
- `game/modules/` — isolated modules
- `game/assets/` — runtime assets only
- `docs/` — manifests and phase records
- `update/version.json` — active build marker

Do not rebuild into an obsolete root `index.js/world.js` structure unless explicitly requested. Preserve the `/game` modular architecture.

## Lobby rebuild objective

Rebuild a full lobby demo using the prior stable baseline and the master manifest. The lobby must include:

- Correct stable floor
- Correct spawn outside the poker table
- North-facing spawn
- High orbit Moon
- High orbit Mars, east-start orientation
- Main poker show table
- Portal in front of every hub/storefront
- Reiki portal as SVR-branded AWAITING APPROVAL placeholder
- PGA portal
- Scorpion Room portal
- Store portal
- Smoker/Social Lounge portal
- Sponsor/Legend/impact portal area
- Watch attached and readable
- Movement module
- Locomotion module
- Teleport module
- Hand tracking module
- Controller fallback module with no visible controller models
- Performance manager module
- Runtime audit module

## Movement and teleport rules

- Quest controller fallback must exist but controller models must stay hidden.
- Right stick or primary stick movement must work.
- 45-degree snap turn target.
- Hand fist method must trigger teleport aim/release where possible.
- Watch press method must trigger teleport mode.
- Teleport must not mutate XR reference space in a way that freezes WebXR.
- Movement/teleport must be modular and testable separately.

## Performance mandate

- Use lightweight Three.js/WebXR runtime, not accidental duplicate script stacks.
- Keep render path simple on Quest.
- Disable shadows unless needed for a specific optimized scene.
- Avoid creating new vectors/materials/geometries every frame.
- Pre-allocate reusable vectors and temporary objects.
- Keep texture size practical: 1024 for close surfaces, 2048 max for sky/background unless explicitly justified.
- Prefer jpg/webp for non-alpha textures.
- Keep root zip/archive files out of runtime loading paths.
- Keep production boot path minimal.

## Poker gameplay mandate

- Texas Hold'em, play-money/social/charity-safe positioning.
- Six seats max per table.
- Left-to-right dealing from dealer button perspective.
- Clear active turn indicator on table and watch.
- 20-second action timer target.
- Auto-check when legal if timer expires.
- Auto-fold when facing a bet if timer expires.
- Auto-stage call amount so player does not need to grab chips just to call.
- Manual chip interaction mainly for raises and immersion.
- Winning hand display.
- Pot/winner banner.
- Winning station/avatar highlight.
- Dealer should not rely on spoken win announcement.
- Hand history strip.

## Multiplayer/account readiness

- Build data structures so multiplayer can be connected without rewriting the whole game.
- Every player should map to a profile id.
- Seats should map to server-side table/session state.
- Admin/god-mode and moderator privileges must be server-driven.
- Sponsorship account permissions must be server-driven.

## Admin panel target

- Public dashboard must not expose private controls before auth.
- Admin panel should include status, users, sponsorships, messages, products, donations, game sessions, hand histories, analytics, and audit logs.
- God-mode controls should be logged.
- Moderator actions should be logged.

## Scene routing rules

Full experiences are private routes/scenes, not full heavy rooms embedded inside the main lobby:

- `game/reiki.html`
- `game/pga-drive.html`
- `game/chip-putt.html`
- `game/store-room.html`
- `game/smoker-lounge.html`
- `game/scorpion.html`

The lobby should show portals/storefronts to these scenes.

## Competition notes

Primary VR poker/social casino competitors include Vegas Infinite/PokerStars VR-style social poker products and smaller VR poker products. SVR should compete legally by focusing on its own identity: charity/impact ecosystem, sponsor hubs, modular private worlds, professional portal lobby, Quest performance, play-money poker, and community/social access.

## Immediate checklist

1. Remove NewServer button/rule.
2. Lock GitHub + PowerShell + Auto Workflow as deploy path.
3. Keep Phase 133/134 stable lightweight lobby as current emergency baseline.
4. Rebuild lobby module cleanly rather than stacking patches.
5. Split movement, locomotion, teleport, watch, poker, portals, performance, account, admin, sponsor, analytics into separate modules.
6. Add AWS backend schema/API manifest.
7. Add game data model manifest.
8. Add admin/god-mode permissions manifest.
9. Add scene readiness checklist.
10. Add test checklist for Quest browser and desktop.

## Phase ladder

- Phase 135: Master manifest cleanup and deploy workflow lock.
- Phase 136: Stable lobby rebuild module pass.
- Phase 137: Movement/locomotion/teleport module lock.
- Phase 138: Watch UI and input bridge lock.
- Phase 139: Poker gameplay table/state lock.
- Phase 140: Portal/private scene routing lock.
- Phase 141: AWS backend/API/schema manifest.
- Phase 142: Account/profile/admin/god-mode manifest.
- Phase 143: Sponsorship/charity/marketing integration manifest.
- Phase 144: Multiplayer readiness manifest.
- Phase 145: Quest performance certification checklist.

## Master rule

Every major phase must update this blueprint or the phase manifest so future AI sessions do not repeat old mistakes, re-add removed temporary buttons, or rebuild the wrong architecture.
