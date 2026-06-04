# Phase 99A — Phase96 Full Lobby Rollback Audit

Date: 2026-06-02
Track: game-side emergency restore

## User report

The current deployed game is missing the last working lobby setup. Missing items reported:

- video hologram
- storefronts
- portal buttons
- lobby hub setup
- Android/mobile behavior

The user supplied the last working package:

- `game_phase96_rooms_portal_routing_lock.zip`
- `UPLOAD_PHASE96_ROOMS_PORTALS.ps1`
- `phase96_rooms_portals_checksums.sha256.txt`

## Grounded rollback source

Use the uploaded ZIP as the authoritative restore package:

`game_phase96_rooms_portal_routing_lock.zip`

ZIP audit summary:

- Contains full `game/` folder.
- Contains `game/index.html`.
- Contains `game/main.js`.
- Contains full `game/modules/` set.
- Contains `game/modules/world_skyline.js`.
- Contains audio module and 07.mp3.
- Contains model assets and texture assets.
- Contains moon and Mars texture assets.
- Contains private room pages.
- Contains Phase 96 room portal docs and route manifests.

## SHA256 checkpoint

Expected package hash from the provided checksum file:

`10c279fa8176872d767f1031855c4f9e38e1ecd53d1c8c5d6afa1af62a61f3b4`

Expected upload script hash:

`2d2436dc524f5d51597acfaca91028713c78b99133bae384bd51fadca5f5fd80`

## Critical files in ZIP

Root runtime:

- `game/index.html`
- `game/main.js`
- `game/manifest.json`
- `game/preview.html`
- `game/cam3.html`

Core modules:

- `game/modules/asset_base.js`
- `game/modules/audio.js`
- `game/modules/config.js`
- `game/modules/core_scene.js`
- `game/modules/desktop_controls.js`
- `game/modules/gestures.js`
- `game/modules/hands.js`
- `game/modules/poker_demo.js`
- `game/modules/teleport.js`
- `game/modules/utils.js`
- `game/modules/watch.js`
- `game/modules/world_skyline.js`
- `game/modules/private_scene_common.js`

Hub modules:

- `game/modules/hubs/pga_hub.js`
- `game/modules/hubs/pga_hub/README.md`
- `game/modules/hubs/reiki_hub/README.md`

Private room pages:

- `game/reiki.html`
- `game/pga-drive.html`
- `game/range.html`
- `game/chip-putt.html`
- `game/store-room.html`
- `game/smoker-lounge.html`
- `game/scorpion.html`

Docs/manifests:

- `game/docs/PHASE_96_ROOMS_PORTAL_ROUTING_LOCK.md`
- `game/docs/BUILD_VERSION.json`
- `game/docs/ROOM_PORTAL_ROUTE_MANIFEST.json`

## Restore decision

The current patch-chain attempts after Phase 98S-W/Y are not enough because they attempted to reconstruct individual symptoms. The correct fix is to restore the full Phase96 `game/` tree, not patch one module at a time.

## Required restore method

Run the provided PowerShell restore script locally. It will:

1. Reset local repo to `origin/main`.
2. Verify the ZIP contains `PHASE-96-ROOMS-PORTAL-ROUTING-LOCK`.
3. Copy the ZIP to `update/game.zip`.
4. Replace the entire `game/` directory with the supplied Phase96 `game/` folder.
5. Write `update/version.json`.
6. Commit and push.

## Important protection

This is a game-side rollback only. Do not touch the public Matrix launch page or website/site files.

## Next phase

# Phase 99B — Full Phase96 Restore Commit and Deploy

Acceptance test after deploy:

- Lobby storefronts/hubs are visible again.
- Reiki/video hologram is visible again.
- Portal buttons/room routes are visible again.
- Scorpion room opens.
- PGA Drive opens.
- Chip/Putt opens.
- Store Room opens.
- Smoker Lounge opens.
- Reiki room/page opens.
- Moon/Mars use the Phase96 asset setup.
- Audio is not autoplaying from spawn unless deliberately started.

## PowerShell command

Use:

```powershell
cd "C:\Users\$env:USERNAME\SVR"

$zip = "$env:USERPROFILE\Downloads\game_phase96_rooms_portal_routing_lock.zip"
$script = "$env:USERPROFILE\Downloads\UPLOAD_PHASE96_ROOMS_PORTALS.ps1"

powershell -ExecutionPolicy Bypass -File $script -RepoRoot (Get-Location).Path -GameZip $zip
```

Then run GitHub Actions Auto Deploy on `main`.
