# Phase 346 — Avatar Creator and Dressing Room Lock

## Build
`PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK`

Phase 346 adds a dedicated live 3D avatar dressing room, a live profile preview, a shared wardrobe catalog, and one schema-versioned avatar record for the website, Android, Quest, PC, the Phase 345 profile API, and future Unity migration.

## Main routes
- `/site/avatar.html?v=phase346`
- `/site/profile.html?v=phase346`
- `/game/avatar.html?v=phase346`

## Verified avatar pipeline
Current `main` contains two verified rigged bodies:

- `/game/assets/models/eric/eric.fbx`
- `/game/assets/models/claudia/claudia.fbx`

Eric is the default player body and Claudia is selectable. Both are normalized in the preview, while their poker NPC instances remain separate. The viewer also supports future GLB/glTF bodies and uses a procedural mannequin if any selected asset fails.

The original draft referenced `player.glb`, but the Phase 346 CI gate correctly proved that asset is absent from current `main`. The corrected catalog and workflow now verify every model path, format, height, default body, and preset before merge.

Because the current FBX bodies are complete character models rather than modular clothing sets, starter clothing and accessories are independent lightweight preview layers. The saved outfit record is provider-neutral and can later map to dedicated FBX/GLB assets or Unity equipment prefabs.

## Runtime QA
```js
window.SVR_PHASE346_AVATAR_QA()
window.SVR_PHASE346_PROFILE_AVATAR_QA()
window.SVR_PHASE346_AVATAR_BRIDGE_QA()
window.SVR_PLAYER_AVATAR_PROFILE
window.SVR_OPEN_AVATAR_ROOM()
```

## Production truth
The static dressing room deploys with GitHub Pages. Outfit records populate the production database only after the Phase 345 backend is deployed and `site/config/player-api.json` contains its approved HTTPS API URL. Until then, demo outfits remain local and visibly labeled.
