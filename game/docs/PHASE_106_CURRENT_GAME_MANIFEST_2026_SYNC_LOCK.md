# SVR Poker — Phase 106 Current Game Manifest 2026 Sync Lock

**Phase:** `PHASE-106-CURRENT-GAME-MANIFEST-2026-SYNC-LOCK`  
**Current runtime:** `PHASE-105-RUNTIME-AUDIT-LATEST-MODULE-SYNC-LOCK`  
**Scope:** Game documentation / manifest sync only  
**Site touched:** No  
**Track:** Game side only

---

## Purpose

Phase 106 updates the current game manifest after the Phase 100–105 work. It does not replace the runtime. The active runtime remains Phase 105.

---

## Current preserved modules

```text
game/modules/playable_poker.js
game/modules/watch.js
game/modules/poker_action_hud.js
game/modules/poker_table_fx.js
game/modules/npc_bot_animation_fx.js
game/modules/poker_feedback_fx.js
game/modules/poker_card_mesh_sync.js
game/modules/poker_chip_motion_fx.js
game/modules/teleport.js
game/modules/private_scene_route_guard.js
game/modules/runtime_audit_guard.js
game/modules/runtime_health_panel.js
```

---

## Current runtime globals

```text
window.SVR_PLAYABLE_POKER
window.SVR_POKER_ACTION_HUD
window.SVR_PHASE101_VISUAL_CARD_MESH_SYNC
window.SVR_PHASE102_CHIP_MOTION_FX
window.SVR_PHASE103_CONTROLLER_INPUT
window.SVR_PHASE104_PRIVATE_ROUTE_GUARD
window.SVR_PHASE105_RUNTIME_AUDIT
window.SVR_PHASE105_RUNTIME_HEALTH_PANEL
```

---

## Major locks now preserved

- Poker playable logic.
- Watch poker controls.
- Desktop/Android HUD.
- Side-pot and all-in handling.
- Active seat/pot/winner FX.
- NPC bot animation FX.
- Turn/action/winner feedback toasts.
- Visible card mesh sync.
- Chip throw/sweep animation.
- Quest controller input polish.
- Private route guard.
- Runtime audit and health panel.
- Site protection lock.
- Reiki approval safety lock.

---

## Next recommended phase

### Phase 107 — Raise Sizing UI + Illegal Button Disabled States

Goal:

- expose min/half-pot/pot/all-in raise choices in desktop HUD
- disable illegal HUD actions when it is not the player turn
- keep watch buttons working
- keep poker logic source of truth in `playable_poker.js`
- preserve all Phase 85–106 locks

---

## Deploy check

After deploy:

```text
https://svrpoker.com/game/?v=phase106-manifest-sync
```

Then:

```text
Ctrl + F5
```

Open **HEALTH** and verify the current runtime reports Phase 105 with the latest modules listed.
