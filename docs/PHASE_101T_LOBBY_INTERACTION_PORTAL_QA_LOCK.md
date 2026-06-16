# Phase 101T - Lobby Interaction Portal QA Lock

## Purpose

Turn the finished lobby into a usable interaction layer after Phase 101S visual polish.

This phase is late-load safe and runs after the core runtime, Phase 260 geometry, and Phase 101S finished lobby layer.

## Patch applied

### New module

```text
game/phase101t_lobby_interaction_portal_qa_lock.js
```

Adds:

- Portal hit zones for PGA, Wellness, Store, and Scorpion.
- Visible prompt rings and labels.
- Mouse/touch click selection support.
- Keyboard shortcuts:

```text
1 = PGA
2 = Wellness
3 = Store
4 = Scorpion
```

- Dispatches a browser event on portal selection:

```text
svr-portal-selected
```

- Writes last selected portal to:

```text
window.SVR_PHASE101T_LAST_PORTAL
```

- Adds QA board in lobby.
- Adds QA checks for scene, renderer, camera, Phase 101S lobby, Phase 260 geometry, portal root, boot release, Moon/Mars.

### Updated game entry

```text
game/index.html
```

Safe load order now:

```text
phase101_boot_load_screen_recovery.js
phase101_partial_runtime_render_guard.js
phase101_render_marker_cleanup.js
main.js
phase260_roman_canopy_archway_final_lock.js delayed
phase101s_finished_lobby_lock.js delayed
phase101t_lobby_interaction_portal_qa_lock.js delayed
```

## Runtime checks

Console:

```text
window.SVR_PHASE101T_LOBBY_QA
window.SVR_PHASE101T_LAST_PORTAL
window.SVR_RUN_PHASE101T_QA()
```

Expected:

```text
window.SVR_PHASE101T_LOBBY_QA.status === "ready"
```

## Portal event payload

When a portal is selected:

```json
{
  "key": "pga",
  "label": "PGA",
  "target": "driving-range",
  "activatedAt": "ISO date",
  "build": "PHASE-101T-LOBBY-INTERACTION-PORTAL-QA-LOCK"
}
```

## Validation URL

```text
https://svrpoker.com/game/index.html?v=phase101t-lobby-interaction
```

## Manual QA

- [ ] Page does not get stuck on loading.
- [ ] Finished lobby appears.
- [ ] Portal labels are visible.
- [ ] Click/touch each portal zone.
- [ ] Press 1, 2, 3, 4 on keyboard and verify `window.SVR_PHASE101T_LAST_PORTAL` updates.
- [ ] Run `window.SVR_RUN_PHASE101T_QA()`.
- [ ] Confirm `window.SVR_PHASE101T_LOBBY_QA.status` is ready or inspect failed checks.

## Locked rule

This phase adds lobby interaction/QA only. It does not change admin API, Android movement, Quest movement scripts, sponsor approval logic, or Unity logic.

## Commit name

```text
Phase 101T - Lobby Interaction Portal QA Lock
```
