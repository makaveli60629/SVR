# Phase 247 — Direct Deploy + Route Verify Lock

Build label: `PHASE-247-DIRECT-DEPLOY-ROUTE-VERIFY-LOCK`

## Scope

Game-side only. This phase keeps the lobby and website untouched while synchronizing the live deploy source files.

## Locked behavior

- `/game/index.html` shows Phase 247.
- `/game/docs/BUILD_VERSION.json` shows Phase 247.
- `/update/version.json` shows Phase 247.
- Private route pages show Phase 247.
- Lobby remains a portal hub only.
- Reiki, PGA Drive, Chip/Putt, Store Room, Smoker Lounge, and Scorpion remain separate routes.
- No unapproved Reiki sponsor/founder branding is introduced.
- Game ZIP remains under 25 MB.

## Deploy note

The GitHub Pages workflow deploys the committed `/game` folder directly, so both `/game` and `update/game.zip` must be committed together to avoid label drift.
