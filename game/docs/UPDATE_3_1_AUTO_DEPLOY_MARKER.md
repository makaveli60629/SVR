# Phase 346 Auto Deploy Marker

## Build
`PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Avatar validation workflow: `.github/workflows/phase346-avatar-check.yml`

## Payload
- `site/avatar.html`
- `site/profile.html`
- `site/data/avatar-catalog.json`
- `site/js/phase346-avatar-viewer.js`
- `site/js/phase346-avatar-room.js`
- `site/js/phase346-profile-avatar-preview.js`
- `site/tools/phase346-avatar-catalog-test.mjs`
- `game/avatar.html`
- `game/modules/phase346_player_avatar_profile_bridge.js`
- `game/modules/phase340_platform_manifest.js`
- Android and Quest/desktop entry versions
- Phase 346 release records and documentation

## Avatar locks
- Default player model: `/game/assets/models/player.glb`
- Target dressing-room height: 1.72 meters
- One schema-versioned `equippedOutfit` profile record
- Safe procedural mannequin if the GLB cannot load
- Android, Quest, and desktop receive the avatar profile bridge
- Camera 3 receives no account or avatar session bridge
- Eric and Claudia remain NPC assets

## Runtime QA
```js
window.SVR_PHASE346_AVATAR_QA()
window.SVR_PHASE346_PROFILE_AVATAR_QA()
window.SVR_PHASE346_AVATAR_BRIDGE_QA()
window.SVR_PLAYER_AVATAR_PROFILE
window.SVR_OPEN_AVATAR_ROOM()
```

## Database truth
The Phase 345 secure backend already accepts and stores `avatarUrl` and `equippedOutfit`. Production database saving remains disabled until that backend is deployed and the public player API configuration receives its approved HTTPS URL. Demo outfits remain local and visibly labeled.

## Locked APK behavior
- APK version: `0.1.0-rc1`
- APK version code: `1`
- Forced update: `false`
- Automatic update prompt: `false`
- Manual update only: `true`
