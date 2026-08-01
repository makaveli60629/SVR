# Phase 346 — Avatar Creator and Dressing Room Lock

## Build
`PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK`

Phase 346 adds a dedicated live 3D avatar dressing room, a live profile preview, a shared wardrobe catalog, and one schema-versioned avatar record for the website, Android, Quest, PC, the Phase 345 profile API, and future Unity migration.

## Main routes
- `/site/avatar.html?v=phase346`
- `/site/profile.html?v=phase346`
- `/game/avatar.html?v=phase346`

## Current avatar pipeline
The existing `/game/assets/models/player.glb` is normalized to a 1.72-meter preview avatar. Because that GLB is a single skinned mesh rather than a modular clothing set, starter clothing and accessories are independent lightweight preview layers. The saved outfit record is provider-neutral and can later map to dedicated GLB or Unity equipment assets.

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
