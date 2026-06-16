# Phase 101V - Safe Loader Wiring Retry + Quest Portal Live Test

## Purpose

Wire the Phase 101U Quest/controller portal QA module into the safe loader without breaking the recovered boot flow.

## Patch applied

### New bridge module

```text
game/phase101v_safe_loader_bridge.js
```

Purpose:

- Late-loads Phase 101U after Phase 101T.
- Exposes manual loader:

```text
window.SVR_LOAD_PHASE101U_QA()
```

- Writes runtime object:

```text
window.SVR_PHASE101V_SAFE_LOADER_BRIDGE
```

### Updated game entry

```text
game/index.html
```

Current safe load order:

```text
phase101_boot_load_screen_recovery.js
phase101_partial_runtime_render_guard.js
phase101_render_marker_cleanup.js
main.js
phase260_roman_canopy_archway_final_lock.js delayed
phase101s_finished_lobby_lock.js delayed
phase101t_lobby_interaction_portal_qa_lock.js delayed
phase101v_safe_loader_bridge.js delayed
phase101u_quest_controller_portal_teleport_qa.js loaded by bridge
```

## Runtime checks

Console:

```text
window.SVR_PHASE101V_SAFE_LOADER_BRIDGE
window.SVR_LOAD_PHASE101U_QA()
window.SVR_PHASE101U_QUEST_QA
window.SVR_RUN_PHASE101U_QA()
```

Expected:

```text
window.SVR_PHASE101V_SAFE_LOADER_BRIDGE.loaded101U === true
window.SVR_PHASE101U_QUEST_QA.active === true
```

## Validation URL

```text
https://svrpoker.com/game/index.html?v=phase101v-safe-loader-bridge
```

## Manual Quest live test

- [ ] Open validation URL in Quest Browser.
- [ ] Wait for lobby to appear.
- [ ] Enter WebXR.
- [ ] Point controller at PGA portal.
- [ ] Press trigger/select.
- [ ] Confirm portal payload updates:

```text
window.SVR_PHASE101U_LAST_CONTROLLER_PORTAL
```

- [ ] Repeat for Wellness, Store, and Scorpion.
- [ ] Run:

```text
window.SVR_RUN_PHASE101U_QA()
```

- [ ] Confirm no stuck loading screen.

## Rollback

If a loader regression appears, revert only:

```text
game/index.html
```

to Phase 101T or Phase 101S. The bridge module itself is late-load safe and does not change boot behavior unless the game entry loads it.

## Locked rule

This phase only wires Quest portal QA into the safe loader. It does not change admin API, public site, Android movement, Quest locomotion core, sponsor content, or Unity logic.

## Commit name

```text
Phase 101V - Safe Loader Wiring Retry and Quest Portal Live Test
```
