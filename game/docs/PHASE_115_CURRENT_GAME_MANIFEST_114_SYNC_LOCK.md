# SVR Poker — Phase 115 Current Game Manifest 114 Sync Lock

**Phase:** `PHASE-115-CURRENT-GAME-MANIFEST-114-SYNC-LOCK`  
**Current runtime:** `PHASE-114-RUNTIME-AUDIT-HEALTH-SYNC-LOCK`  
**Scope:** Game documentation / manifest sync only  
**Site touched:** No  
**Track:** Game side only

## Purpose

Phase 115 updates the game manifest after Phase 107 through Phase 114. It does not replace runtime code. It records the current stable modular stack and next recommended phases.

## Current protected stack

```text
game/index.html
game/main.js
game/modules/playable_poker.js
game/modules/watch.js
game/modules/poker_action_hud.js
game/modules/poker_card_mesh_sync.js
game/modules/poker_chip_motion_fx.js
game/modules/private_scene_route_guard.js
game/modules/quest_performance_monitor.js
game/modules/gameplay_demo_polish.js
game/modules/runtime_health_sync_patch.js
game/modules/runtime_audit_guard.js
```

## Active runtime globals

```text
window.SVR_PHASE114_RUNTIME_AUDIT
window.SVR_PHASE113_RUNTIME_HEALTH_SYNC
window.SVR_PHASE111_GAMEPLAY_DEMO_POLISH
window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR
window.SVR_PHASE108_WATCH_POKER_DISABLED_STATES
window.SVR_PHASE107_RAISE_SIZING_HUD
```

## Next recommended phase

```text
Phase 116 — Custom Raise Slider/Input Polish
```

Goal:

- add custom raise amount input
- keep Min / Half Pot / Pot / All-In buttons
- prevent illegal raise values
- preserve poker logic source of truth
- preserve watch, HUD, cards, chips, PERF, DEMO, HEALTH, and private route guard

## Deploy check

```text
https://svrpoker.com/game/?v=phase115-manifest-sync
```

Then press:

```text
Ctrl + F5
```

Confirm HEALTH, PERF, DEMO, poker HUD, watch locks, cards, chip motion, and private route guard still work.
