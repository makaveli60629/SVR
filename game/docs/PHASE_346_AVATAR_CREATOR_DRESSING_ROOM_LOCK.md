# Phase 346 — Avatar Creator and Dressing Room Lock

## Build
`PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK`

## Purpose
Phase 346 adds one player-avatar record shared by the website, Android, Quest, PC, the Phase 345 profile API, and the future Unity client.

## Routes
- Website dressing room: `/site/avatar.html?v=phase346`
- Game avatar route: `/game/avatar.html?v=phase346`
- Profile live preview: `/site/profile.html?v=phase346`

## Verified avatar authority
- Eric body: `/game/assets/models/eric/eric.fbx`, normalized to 1.78 meters
- Claudia body: `/game/assets/models/claudia/claudia.fbx`, normalized to 1.70 meters
- Default player body: Eric
- Supported viewer formats: FBX, GLB, and glTF
- Safe fallback: lightweight procedural mannequin
- Eric and Claudia NPC instances remain separate from dressing-room player clones.
- The dressing room does not load the poker lobby or Camera 3 runtime.

The first Phase 346 validation run rejected a stale `/game/assets/models/player.glb` reference because that file is not present on current `main`. The corrected catalog resolves only models verified in the repository, and CI checks every catalog path before merge.

## Starter wardrobe
- Two verified body choices
- Five color palettes
- Headwear: none, SVR cap, beanie, founder crown
- Eyewear: none, neon frames, VR visor
- Tops: base, casino jacket, dealer vest, SVR hoodie
- Shoes: base, neon sneakers, black boots
- Accessories: none, gold chain, SVR watch, founder badge
- Four complete presets
- Randomize, reset, save, camera reset, auto rotate, and portrait capture

The verified FBX bodies are complete rigged characters rather than modular clothing collections. Phase 346 therefore adds independent lightweight equipment layers in the dressing-room preview. The saved schema already supports replacing each generated layer with dedicated FBX/GLB equipment later.

## Saved profile schema
```json
{
  "avatarUrl": "https://svrpoker.com/game/assets/models/eric/eric.fbx",
  "equippedOutfit": {
    "schemaVersion": 1,
    "modelId": "eric",
    "palette": "midnight",
    "headwear": "cap",
    "eyewear": "none",
    "top": "jacket",
    "shoes": "sneakers",
    "accessory": "watch"
  }
}
```

The Phase 345 backend already validates and stores `avatarUrl` and `equippedOutfit`. Database mode saves the record through the secure profile API. Demo mode saves it only on the current device and remains visibly labeled.

## Game bridge
Playable Android, Quest, and desktop routes expose:

```js
window.SVR_PLAYER_AVATAR_PROFILE
window.SVR_PHASE346_AVATAR_SYNC()
window.SVR_PHASE346_AVATAR_BRIDGE_QA()
window.SVR_OPEN_AVATAR_ROOM()
```

The bridge includes `modelUrl`, `modelFormat`, `targetHeightMeters`, and the complete outfit record. Camera 3 explicitly excludes the account and avatar bridges.

## Dressing-room QA
```js
window.SVR_PHASE346_AVATAR_QA()
window.SVR_PHASE346_APPLY_PRESET('founder')
window.SVR_PHASE346_SAVE_OUTFIT()
window.SVR_PHASE346_PROFILE_AVATAR_QA()
```

QA reports model load status, fallback status, outfit schema, equipment object count, draw calls, triangles, geometry count, texture count, FPS, category population, account mode, and save state.

## Unity handoff
Unity should consume the same profile record and resolve:

1. `modelId` or `avatarUrl` to an approved base prefab/Addressable.
2. Each equipment category to an attachment prefab or skinned clothing mesh.
3. Palette IDs to material presets.
4. Inventory ownership before equipping non-starter items.
5. A safe mannequin when any asset fails.
6. Eric and Claudia player prefabs separately from poker-table NPC prefabs.

## Protected locks
- Phase 336 remains poker-ledger authority.
- Phase 341 remains table/card geometry authority.
- Phase 342 remains performance authority.
- Phases 343–344 remain Android HUD/input authorities.
- Phase 345 remains account/activity/reward authority.
- APK remains `0.1.0-rc1`, code `1`.
- Forced and recurring APK update prompts remain disabled.
