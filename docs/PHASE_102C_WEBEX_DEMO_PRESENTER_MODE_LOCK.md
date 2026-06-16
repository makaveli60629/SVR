# Phase 102C - Webex/Demo Presenter Mode Lock

## Purpose

Add a Webex/demo presenter mode after the Phase 102B release-candidate bug sweep.

This phase does not rebuild the scene and does not rewrite the boot entry.

## Patch applied

### New module

```text
game/phase102c_webex_demo_presenter_mode_lock.js
```

Adds:

- Webex/demo presenter mode object.
- Clean overlay removal.
- Presenter badge.
- Clean mode that hides HUD/nav/log/error/phase-label elements.
- Optional camera presets.
- Presenter QA object.
- Manual presenter-mode console functions.

### Updated bridge

```text
game/phase101v_safe_loader_bridge.js
```

Now safely loads:

```text
phase101u_quest_controller_portal_teleport_qa.js
phase101w_quest_live_movement_portal_verification.js
phase101x_quest_live_fix_pass.js
phase101y_lobby_visual_final_qa_presentation_lock.js
phase102a_final_lobby_release_candidate_lock.js
phase102b_release_candidate_bug_sweep_checklist.js
phase102c_webex_demo_presenter_mode_lock.js
```

The main game entry was not rewritten.

## Runtime checks

Console:

```text
window.SVR_PHASE102C_PRESENTER_MODE
window.SVR_ENABLE_PHASE102C_PRESENTER_MODE()
window.SVR_RUN_PHASE102C_PRESENTER_QA()
window.SVR_PHASE102C_CAMERA('front')
window.SVR_PHASE102C_CAMERA('portal')
window.SVR_PHASE102C_CAMERA('table')
window.SVR_LOAD_PHASE102C_PRESENTER_MODE()
```

Presenter-ready condition:

```text
window.SVR_PHASE102C_PRESENTER_MODE.presenterReady === true
```

## URLs

Normal presenter mode:

```text
https://svrpoker.com/game/index.html?v=phase102c-presenter-mode
```

Clean Webex mode:

```text
https://svrpoker.com/game/index.html?v=phase102c-presenter-mode&webex=1&clean=1
```

Camera presentation mode:

```text
https://svrpoker.com/game/index.html?v=phase102c-presenter-mode&webex=1&presentation=1
```

Camera presets:

```text
https://svrpoker.com/game/index.html?v=phase102c-presenter-mode&webex=1&camera102c=front
https://svrpoker.com/game/index.html?v=phase102c-presenter-mode&webex=1&camera102c=portal
https://svrpoker.com/game/index.html?v=phase102c-presenter-mode&webex=1&camera102c=table
```

## Manual QA

- [ ] Load normal presenter URL.
- [ ] Confirm no loader card remains.
- [ ] Confirm presenter badge appears.
- [ ] Load clean Webex URL.
- [ ] Confirm HUD/nav/log/phase-label elements are hidden.
- [ ] Load presentation camera URL.
- [ ] Confirm camera starts in clean front view.
- [ ] Run `window.SVR_RUN_PHASE102C_PRESENTER_QA()`.
- [ ] Confirm `presenterReady === true` or inspect blockers.

## Locked rule

This phase is presenter/demo mode only. It does not change admin API, public site, Android movement, core Quest locomotion scripts, sponsor content, or Unity logic.

## Commit name

```text
Phase 102C - Webex Demo Presenter Mode Lock
```
