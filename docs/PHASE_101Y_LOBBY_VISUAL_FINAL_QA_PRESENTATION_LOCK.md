# Phase 101Y - Lobby Visual Final QA + Screenshot-Ready Presentation Lock

## Purpose

Add final lobby visual QA and screenshot/Webex presentation readiness checks after the Quest live fix pass.

## Patch applied

### New module

```text
game/phase101y_lobby_visual_final_qa_presentation_lock.js
```

Adds:

- Final visual QA object.
- Screenshot-ready status check.
- Presentation QA board inside the lobby.
- Presentation markers for Spawn, Table, PGA, Wellness, Store, and Scorpion.
- Optional presentation camera lock via URL:

```text
?presentation=1
```

or:

```text
?camera101y=1
```

- Console QA runner:

```text
window.SVR_RUN_PHASE101Y_QA()
```

- Manual camera function:

```text
window.SVR_APPLY_PHASE101Y_PRESENTATION_CAMERA()
```

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
```

The main game entry was not rewritten.

## Runtime checks

Console:

```text
window.SVR_PHASE101Y_PRESENTATION_QA
window.SVR_RUN_PHASE101Y_QA()
window.SVR_LOAD_PHASE101Y_PRESENTATION_QA()
```

Expected:

```text
window.SVR_PHASE101Y_PRESENTATION_QA.active === true
```

Screenshot-ready condition:

```text
window.SVR_PHASE101Y_PRESENTATION_QA.status === "screenshot-ready"
```

If it reports `needs-visual-review`, inspect:

```text
window.SVR_PHASE101Y_PRESENTATION_QA.failed
window.SVR_PHASE101Y_PRESENTATION_QA.checks
window.SVR_PHASE101Y_PRESENTATION_QA.portalKeys
```

## Validation URLs

Normal:

```text
https://svrpoker.com/game/index.html?v=phase101y-presentation-lock
```

Clean presentation camera:

```text
https://svrpoker.com/game/index.html?v=phase101y-clean-shot&presentation=1
```

## Manual visual QA

- [ ] Lobby loads without stuck boot screen.
- [ ] Main SVR sign is readable.
- [ ] Red carpet path is open.
- [ ] PGA portal is visible and readable.
- [ ] Wellness portal is visible and readable.
- [ ] Store portal is visible and readable.
- [ ] Scorpion portal is visible and readable.
- [ ] Moon and Mars are high in the north sky.
- [ ] Table remains central and readable.
- [ ] QA board reports screenshot-ready or lists exact failed visual checks.

## Locked rule

This phase is presentation/visual QA only. It does not change admin API, public site, Android movement, Quest locomotion core, sponsor content, or Unity logic.

## Commit name

```text
Phase 101Y - Lobby Visual Final QA Presentation Lock
```
