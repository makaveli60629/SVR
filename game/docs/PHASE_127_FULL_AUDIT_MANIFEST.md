# Phase 127 — Full Audit Manifest and Error Cleanup Lock

## Date

2026-05-20

## Scope lock

Game-side only.

Do not touch:

- website files
- public page files
- `/site` files
- SQL/backend files
- Reiki storefront signs/text/layout/branding/approval placeholder
- unapproved sponsor/founder branding

## Current audit findings

### 1. Controller movement still needs final clean landing

`game/modules/teleport.js` still reports the old Phase 103 controller label. This means the later right-controller movement hardfix did not land cleanly yet.

Required next fix:

- Right controller stick Y moves forward/back.
- Right controller stick X snap-turns in 45-degree increments.
- Left stick must not override right-controller movement.
- Deadzone prevents drift.
- Movement must not freeze teleport.
- Movement must not break watch interaction.

### 2. Hand material/texture is missing

`game/modules/hands.js` currently creates WebXR hand models and hidden controller hand proxies, but there is not yet a dedicated lightweight skin-like hand material pass.

Required next fix:

- Add lightweight skin-like material/texture effect.
- Preserve WebXR hand tracking.
- Preserve Quest controller fallback.
- Keep controller meshes hidden.
- Do not break the forearm watch.

### 3. Eric NPC is planned but not implemented yet

Eric NPC is locked as a standalone nearby NPC near the Reiki area.

Required next fix:

- Add Eric as a standalone character near, but not inside or editing, the Reiki storefront.
- Use available Eric asset if possible.
- If only FBX exists, use FBX now and document GLB conversion later.
- Eric must not block walkway, teleport route, portals, watch, cards, table UI, or Scorpion gameplay.

### 4. Reiki storefront must remain untouched

Hard lock:

- No edits to Reiki storefront text.
- No edits to Reiki storefront signs.
- No edits to Reiki storefront layout.
- No external Reiki website references.
- No founder names/photos/logos.
- Keep SVR / awaiting-approval placeholder state unless explicitly approved later.

### 5. Card readability and table tags were improved

Phase 118 updates were committed:

- Bigger card ranks/suits in `game/modules/poker_card_mesh_sync.js`.
- Raised table/avatar tags in `game/modules/npc_avatar_system.js`.

Required preservation:

- Cards must still deal left-to-right.
- Card text must stay readable from seated Scorpion view.
- Raised table tags must remain visible without blocking cards or prompts.

### 6. Teleport and watch hardfixes were committed, but require live QA

Phase 116/117 updates were committed:

- Emergency teleport freeze guard.
- Watch hardfix module.
- Watch hardfix wiring into `game/main.js`.

Required validation:

- Teleport does not freeze.
- Fist/grip/A/trigger teleport fallback remains safe.
- Watch remains upright/readable.
- Watch remains usable after teleport and while seated.

### 7. Moon and Mars visibility still needs verification/fix

The lobby needs visible Moon and Mars.

Required next fix:

- Moon visible in lobby.
- Mars visible in lobby.
- Both high above/behind skyline.
- Both Quest-safe and lightweight.
- Neither blocks cards, portals, watch, table UI, or Scorpion gameplay.

## Missing/next work queue

1. Land right-controller movement hardfix cleanly.
2. Add hand material/texture patch.
3. Add Eric standalone NPC near Reiki area without touching storefront.
4. Verify or restore Moon/Mars lobby visibility.
5. Run live Quest QA after Auto Deploy.
6. Continue Scorpion poker polish only after controls and watch pass.

## Stability checklist

- Game boots without black screen.
- No console error loop.
- No repeated heavy object creation from teleport.
- Quest controller movement works.
- Teleport does not freeze.
- Watch is upright/readable.
- Hands render with improved material.
- Eric appears near Reiki area and does not block movement.
- Reiki storefront remains untouched.
- Moon and Mars are visible in lobby.
- Scorpion room loads.
- Cards deal left-to-right.
- Card text is readable.
- Raised table tags are visible.
- Website and backend untouched.

## Locked next phase recommendation

Phase 128 should implement the actual missing fixes in this order:

1. right-controller movement commit
2. hand material patch
3. Eric standalone NPC patch
4. Moon/Mars visibility patch

Do not add new rooms, sponsor content, website wiring, SQL/backend work, or monetization changes until this stability gate passes.
