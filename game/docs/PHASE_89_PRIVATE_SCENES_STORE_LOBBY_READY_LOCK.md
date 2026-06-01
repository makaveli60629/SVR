# Phase 89 — Private Scenes + Store/Lobby Ready Lock

Build: `PHASE-89-PRIVATE-SCENES-STORE-LOBBY-READY-LOCK`

## Scope
- Game-side only.
- Site untouched.
- Lobby stays as the portal hub.
- Private destination pages restored/added for Reiki, PGA Drive, Chip/Putt, Store Room, Smoker Lounge, and Scorpion.
- Locomotion lock preserved: right stick forward/back, right stick 45-degree snap turn, hold A/grip/trigger to aim teleport, release to teleport.
- Reiki hologram stays paused by default and only activates from the Reiki route.
- Lobby music remains manual only through M/watch.

## Private pages
- `game/reiki.html`
- `game/pga-drive.html`
- `game/chip-putt.html`
- `game/store-room.html`
- `game/smoker-lounge.html`
- `game/scorpion.html`
- `game/reiki-video-portal.html`

## Test
1. Load `/game/?v=phase89`.
2. Check right-stick movement and snap turn.
3. Hold A/grip/trigger to aim teleport; release to teleport.
4. Use bottom buttons for Store Room, Drive, Chip/Putt, Lounge, Reiki Video.
5. Confirm lobby music remains off until manually toggled.
6. Confirm Reiki video remains paused unless opened from Reiki.
